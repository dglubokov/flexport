import os
from pathlib import Path
from urllib.parse import unquote

from fastapi import FastAPI, HTTPException, status, Depends, File, UploadFile, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2AuthorizationCodeBearer
from pydantic import BaseModel

from flexport.tokens import create_access_token, get_current_user
from flexport.utils import authenticate_user


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


class Credentials(BaseModel):
    username: str
    password: str


@app.post("/login")
def login(creds: Credentials):
    is_authenticated = authenticate_user(creds.username, creds.password)
    if not is_authenticated:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    # Create JWT token
    access_token = create_access_token(data={"sub": creds.username})
    return JSONResponse(content={"access_token": access_token, "token_type": "bearer"})


@app.get("/list_files")
def list_files(path: str = "", current_user: str = Depends(get_current_user)):
    # Construct the absolute path
    home_dir = os.path.expanduser(f"~{current_user}")
    target_path = os.path.normpath(os.path.join(home_dir, unquote(path)))

    # Prevent directory traversal attacks
    if not target_path.startswith(home_dir):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid path",
        )

    if not os.path.exists(target_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Directory not found",
        )

    # List files and directories
    try:
        p = Path(target_path)
        items = []
        for item in p.iterdir():
            raw_size = item.stat().st_size
            items.append(
                {
                    "name": item.name,
                    "is_file": item.is_file(),
                    "is_dir": item.is_dir(),
                    "size": raw_size,
                    "owner": item.owner(),
                    "group": item.group(),
                    "date_created": item.stat().st_ctime,
                    "date_modified": item.stat().st_mtime,
                    "permissions": str(oct(item.stat().st_mode & 0o777))[2:],
                }
            )

        # Sort items by type (directories first, then files) and name
        items = sorted(items, key=lambda x: (not x["is_dir"], x["name"]))

        return {"items": items, "current_path": Path(target_path).absolute().as_posix()}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@app.get("/space_info")
def check_available_space_on_disk(current_user: str = Depends(get_current_user)):
    home_dir = os.path.expanduser(f"~{current_user}")
    stat = os.statvfs(home_dir)
    available_space = stat.f_bavail * stat.f_frsize
    used_space = (stat.f_blocks - stat.f_bfree) * stat.f_frsize
    total_space = stat.f_blocks * stat.f_frsize
    return {
        "available_space": available_space,
        "used_space": used_space,
        "total_space": total_space,
    }


@app.post("/upload")
async def upload_files(
    current_path: str = Form(...),
    files: list[UploadFile] = File(...),  # Expect multiple file uploads
    user: dict = Depends(get_current_user),  # Simulated authenticated user
):
    upload_dir = Path(current_path)

    for file in files:
        if not file.filename:
            continue
        file_path = upload_dir / file.filename
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())

    return JSONResponse(
        content={"message": "Files uploaded successfully.", "uploaded_files": [file.filename for file in files]},
        status_code=200,
    )
