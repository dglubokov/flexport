import os
import stat
from pathlib import Path
from pwd import getpwnam

from fastapi import FastAPI, HTTPException, status, Depends, File, UploadFile, Form, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2AuthorizationCodeBearer
from pydantic import BaseModel

from flexport.tokens import create_access_token, get_current_user, remove_token
from flexport.utils import authenticate_user

MAX_FILE_SIZE = 1 * 1024 * 1024 * 1024  # 1 GB

oauth2_scheme = OAuth2AuthorizationCodeBearer(
    authorizationUrl="/login",
    tokenUrl="/token",
)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------
# Authentication Endpoints
# --------------------------------


class Credentials(BaseModel):
    username: str
    password: str


@app.post("/login")
def login(credentials: Credentials):
    is_authenticated = authenticate_user(credentials.username, credentials.password)
    if not is_authenticated:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    # Create JWT token
    token = create_access_token(data={"sub": credentials.username})
    response = JSONResponse(content={"success": True})
    response.set_cookie(
        key="token",
        value=token,
        httponly=True,
        samesite="lax",
    )
    return response


@app.post("/logout")
def logout(request: Request):
    token = request.cookies.get("token")
    response = JSONResponse(content={"success": True})
    response.delete_cookie(key="token")
    if token:
        remove_token(token)
    return response


@app.get("/check_token")
def check_token(request: Request):
    try:
        _ = get_current_user(request)
        return JSONResponse(content={"authenticated": True})
    except HTTPException:
        return JSONResponse(content={"authenticated": False}, status_code=401)


# --------------------------------
# Files Endpoints
# --------------------------------


def has_access_to_path(path: Path, current_user: str) -> bool:
    try:
        user = getpwnam(current_user)
        file_stat = path.stat()
        if file_stat.st_uid == user.pw_uid:
            return True
        if file_stat.st_gid == user.pw_gid and bool(stat.S_IRGRP & file_stat.st_mode):
            return True
        if bool(stat.S_IROTH & file_stat.st_mode):
            return True
        return False
    except Exception:
        return False


@app.get("/list_files")
def list_files(path: str = "", current_user: str = Depends(get_current_user)):
    target_path = Path(path).resolve() if path else Path.home()

    if not target_path.exists() or not target_path.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Directory not found",
        )

    # Check permissions
    if not has_access_to_path(target_path, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this directory",
        )

    # List files and directories
    try:
        items = []
        for item in target_path.iterdir():
            try:
                stat_result = item.stat()
                items.append(
                    {
                        "name": item.name,
                        "is_file": item.is_file(),
                        "is_dir": item.is_dir(),
                        "size": stat_result.st_size,
                        "owner": item.owner(),
                        "group": item.group(),
                        "date_created": stat_result.st_ctime,
                        "date_modified": stat_result.st_mtime,
                        "permissions": oct(stat_result.st_mode & 0o777),
                    }
                )
            except PermissionError:
                # Skip files that cannot be accessed
                continue

        # Sort items by type (directories first, then files) and name
        items = sorted(items, key=lambda x: (not x["is_dir"], x["name"]))

        return {"items": items, "current_path": target_path.absolute().as_posix()}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@app.get("/space_info")
def check_available_space_on_disk(path: str = "", current_user: str = Depends(get_current_user)):
    # Construct the absolute path
    target_path = Path(path).resolve() if path else Path.home()

    if not has_access_to_path(target_path, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this directory",
        )

    try:
        # Get the statvfs object
        stat = os.statvfs(target_path)

        # Calculate the available, used, and total space
        available_space = stat.f_bavail * stat.f_frsize
        used_space = (stat.f_blocks - stat.f_bfree) * stat.f_frsize
        total_space = stat.f_blocks * stat.f_frsize

        return {
            "path": str(target_path),
            "available_space": available_space,
            "used_space": used_space,
            "total_space": total_space,
        }
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Directory not found",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@app.post("/direct_upload")
async def upload_files(
    current_path: str = Form(...),
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user),
):
    upload_dir = Path(current_path)

    if not upload_dir.is_dir():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid upload directory",
        )

    if not has_access_to_path(upload_dir, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this directory",
        )

    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file selected",
        )

    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds the maximum limit of {MAX_FILE_SIZE} bytes",
        )

    file_path = upload_dir / file.filename
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)

    return JSONResponse(
        content={"message": "Files uploaded successfully.", "uploaded_file": file.filename},
        status_code=200,
    )
