import os
import stat
import uuid
from pathlib import Path
from pwd import getpwnam

from fastapi import FastAPI, HTTPException, status, Depends, File, UploadFile, Form, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2AuthorizationCodeBearer

from flexport.tokens import create_access_token, get_current_user, remove_token
from flexport.utils import authenticate_user
from flexport.sftp_ftp import list_files_ftp, list_files_sftp, download_ftp, download_sftp
from flexport.models import (
    Credentials,
    SessionStatus,
    SessionStatusEnum,
    SessionTypeEnum,
    FTPRequest,
    SFTPRequest,
    FTPDownloadRequest,
)

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
        username = get_current_user(request)
        return JSONResponse(content={"authenticated": True, "username": username})
    except HTTPException:
        return JSONResponse(content={"authenticated": False, "username": ""}, status_code=401)


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


@app.post("/ftp/list-files/")
async def list_files_ftp_endpoint(credentials: FTPRequest):
    """
    List files and directories from an FTP server.
    """
    port = credentials.port if credentials.port else 21
    path = credentials.path if credentials.path else "/"
    try:
        file_list = list_files_ftp(
            host=credentials.host,
            username=credentials.username,
            password=credentials.password,
            port=port,
            path=path,
        )
        if file_list is None:
            raise HTTPException(status_code=500, detail="Failed to fetch the file list.")
        return {"files": file_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/sftp/list-files/")
async def list_files_sftp_endpoint(credentials: SFTPRequest):
    """
    List files and directories from an SFTP server.
    """
    port = credentials.port if credentials.port else 22
    path = credentials.path if credentials.path else "/"
    try:
        file_list = list_files_sftp(
            host=credentials.host,
            username=credentials.username,
            password=credentials.password,
            port=port,
            path=path,
        )
        if file_list is None:
            raise HTTPException(status_code=500, detail="Failed to fetch the file list.")
        return {"files": file_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ftp/download/")
async def download_ftp_endpoint(request: FTPDownloadRequest):
    """
    Download a file or folder from an FTP server.
    """
    try:
        download_ftp(
            host=request.host,
            username=request.username,
            password=request.password,
            remote_path=request.remote_path,
            local_path=request.local_path,
            port=request.port,
        )
        return {"message": f"Downloaded {request.remote_path} to {request.local_path}."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# TODO: Replace with a database
sessions: dict[str, list[SessionStatus]] = {}


@app.post("/sftp/download/")
async def download_sftp_endpoint(request: SFTPRequest, background_tasks: BackgroundTasks):
    """
    Download a file or folder from an SFTP server.
    """
    session_id = str(uuid.uuid4())
    user_sessions = sessions.setdefault(request.local_user_id, [])
    user_sessions.append(
        SessionStatus(session_id=session_id, type=SessionTypeEnum.sftp_download, status=SessionStatusEnum.queued)
    )

    background_tasks.add_task(
        download_sftp,
        sessions,
        request.host,
        request.username,
        request.password,
        request.path,
        request.local_path,
        session_id,
        request.local_user_id,
        request.port,
    )
    return {"message": "Download session created", "session_id": session_id}


@app.get("/sessions/{local_user_id}")
async def get_sessions(local_user_id: str):
    user_sessions = sessions.get(local_user_id, [])
    return {"sessions": user_sessions}
