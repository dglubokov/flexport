import os
import uuid
import time
import aiohttp
import aiofiles
from pathlib import Path

from fastapi import FastAPI, HTTPException, status, Depends, File, UploadFile, Form, Request, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2AuthorizationCodeBearer

from flexport.tokens import create_access_token, get_current_user, remove_token
from flexport.utils import authenticate_user, has_access_to_path
from flexport.sftp_ftp import list_files_ftp, list_files_sftp, download_ftp, download_sftp
from flexport.models import (
    Credentials,
    SessionStatus,
    SessionStatusEnum,
    SessionTypeEnum,
    SFTPRequest,
    LinksUploadBody,
)
from flexport.db import init_db, create_session, get_user_sessions, delete_session, update_session_status, get_session


MAX_FILE_SIZE = 1 * 1024 * 1024 * 1024  # 1 GB

oauth2_scheme = OAuth2AuthorizationCodeBearer(
    authorizationUrl="/login",
    tokenUrl="/token",
)

# FastAPI Application Instance
app = FastAPI(
    on_startup=[init_db],
    title="FlexPort",
    description="A flexible file transfer service.",
    version="0.1.0",
)


# CORS Middleware Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================================================================
# Authentication Endpoints
# ==================================================================
@app.post("/login")
def login(credentials: Credentials):
    """
    Authenticate user and issue JWT token.
    """
    is_authenticated = authenticate_user(credentials.username, credentials.password)
    if not is_authenticated:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
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
    """
    Logout user by removing the JWT token.
    """
    token = request.cookies.get("token")
    response = JSONResponse(content={"success": True})
    response.delete_cookie(key="token")
    if token:
        remove_token(token)
    return response


@app.get("/check_token")
def check_token(request: Request):
    """
    Verify if the JWT token is valid.
    """
    try:
        username = get_current_user(request)
        return JSONResponse(content={"authenticated": True, "username": username})
    except HTTPException:
        return JSONResponse(content={"authenticated": False, "username": ""}, status_code=401)


# ==================================================================
# File Endpoints
# ==================================================================
@app.get("/list_files")
def list_files(path: str = "", current_user: str = Depends(get_current_user)):
    """
    List files and directories in the specified path.
    """
    target_path = Path(path).resolve() if path else Path.home()

    if not target_path.exists() or not target_path.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Directory not found",
        )

    if not has_access_to_path(target_path, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this directory",
        )

    try:
        items = [
            {
                "name": item.name,
                "is_file": item.is_file(),
                "is_dir": item.is_dir(),
                "size": item.stat().st_size,
                "owner": item.owner(),
                "group": item.group(),
                "date_created": item.stat().st_ctime,
                "date_modified": item.stat().st_mtime,
                "permissions": oct(item.stat().st_mode & 0o777),
                "path": str(item),
            }
            for item in target_path.iterdir()
            if not isinstance(item, PermissionError) and item.exists()
        ]
        return {"items": sorted(items, key=lambda x: (not x["is_dir"], x["name"])), "current_path": str(target_path)}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@app.get("/space_info")
def check_available_space_on_disk(path: str = "", current_user: str = Depends(get_current_user)):
    """
    Check available, used, and total space for the given path.
    """
    target_path = Path(path).resolve() if path else Path.home()

    if not has_access_to_path(target_path, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this directory",
        )

    try:
        stat = os.statvfs(target_path)
        return {
            "path": str(target_path),
            "available_space": stat.f_bavail * stat.f_frsize,
            "used_space": (stat.f_blocks - stat.f_bfree) * stat.f_frsize,
            "total_space": stat.f_blocks * stat.f_frsize,
        }
    except FileNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Directory not found.")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@app.post("/direct_upload")
async def upload_files(
    current_path: str = Form(...),
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user),
):
    """
    Upload a file to the specified directory.
    """
    upload_dir = Path(current_path)

    if not upload_dir.is_dir():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid upload directory.")

    if not has_access_to_path(upload_dir, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied.")

    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file selected.")

    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum size of {MAX_FILE_SIZE} bytes.",
        )

    with open(upload_dir / file.filename, "wb") as buffer:
        buffer.write(file_content)

    return {"message": "File uploaded successfully.", "uploaded_file": file.filename}


@app.post("/direct_download")
def download_file(
    path: str = Form(...),
    current_user: str = Depends(get_current_user),
):
    """
    Download a file from the specified directory.
    """
    download_path = Path(path)

    if not download_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found.")

    if not download_path.is_file():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file.")

    if not has_access_to_path(download_path, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied.")

    return FileResponse(path=download_path, filename=download_path.name)


@app.delete("/delete_file")
def delete_file(
    path: str = Form(...),
    current_user: str = Depends(get_current_user),
):
    """
    Delete a file from the specified directory.
    """
    delete_path = Path(path)

    if not delete_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found.")

    if not delete_path.is_file():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file.")

    if not has_access_to_path(delete_path, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied.")

    delete_path.unlink()
    return {"message": "File deleted successfully.", "deleted_file": delete_path.name}


# ==================================================================
# FTP and SFTP Endpoints
# ==================================================================
@app.post("/ftp/list-files/")
async def list_files_ftp_endpoint(credentials: SFTPRequest):
    """
    List files and directories from an FTP server.
    """
    try:
        file_list = await list_files_ftp(
            host=credentials.host,
            username=credentials.username,
            password=credentials.password,
            port=credentials.port or 21,
            path=credentials.path or "/",
        )
        if file_list is None:
            raise HTTPException(status_code=500, detail="Failed to fetch file list.")
        return {"files": file_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/sftp/list-files/")
async def list_files_sftp_endpoint(credentials: SFTPRequest):
    """
    List files and directories from an SFTP server.
    """
    try:
        file_list = await list_files_sftp(
            host=credentials.host,
            username=credentials.username,
            password=credentials.password,
            port=credentials.port or 22,
            path=credentials.path or "/",
        )
        if file_list is None:
            raise HTTPException(status_code=500, detail="Failed to fetch file list.")
        return {"files": file_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ftp/download/")
async def download_ftp_endpoint(request: SFTPRequest, background_tasks: BackgroundTasks):
    """
    Download files from an FTP server.
    """
    session_id = str(uuid.uuid4())
    session = SessionStatus(
        session_id=session_id,
        type=SessionTypeEnum.ftp_download,
        status=SessionStatusEnum.queued,
        file_name=os.path.basename(request.path),
        started_at=time.strftime("%Y-%m-%d %H:%M:%S"),
        started_at_unix=int(time.time()),
        username=request.local_user_id,
        progress=0,
    )
    await create_session(session)

    background_tasks.add_task(
        download_ftp,
        request.host,
        request.username,
        request.password,
        request.path,
        request.local_path,
        session_id,
        request.port,
    )
    return {"message": "Download session created.", "session_id": session_id}


@app.post("/sftp/download/")
async def download_sftp_endpoint(request: SFTPRequest, background_tasks: BackgroundTasks):
    """
    Download a file or folder from an SFTP server.
    """
    session_id = str(uuid.uuid4())
    session = SessionStatus(
        session_id=session_id,
        type=SessionTypeEnum.sftp_download,
        status=SessionStatusEnum.queued,
        file_name=os.path.basename(request.path),
        started_at=time.strftime("%Y-%m-%d %H:%M:%S"),
        started_at_unix=int(time.time()),
        uploaded_at=request.local_path,
        username=request.local_user_id,
        progress=0,
    )
    await create_session(session)

    background_tasks.add_task(
        download_sftp,
        request.host,
        request.username,
        request.password,
        request.path,
        request.local_path,
        session_id,
        request.port,
    )
    return {"message": "Download session created", "session_id": session_id}


# ==================================================================
# Sessions Endpoints
# ==================================================================
@app.get("/sessions/{username}")
async def get_sessions(username: str):
    """
    Get all sessions for a user.
    """
    db_sessions = await get_user_sessions(username)
    sessions = []

    for db_session in db_sessions:
        sessions.append(
            SessionStatus(
                session_id=db_session[0],
                username=db_session[1],
                type=SessionTypeEnum(db_session[2]),
                status=SessionStatusEnum(db_session[3]),
                file_name=db_session[4],
                started_at=db_session[5],
                started_at_unix=db_session[6],
                uploaded_at=db_session[7],
                completed_at=db_session[8] or "",
                details=db_session[9],
                progress=int(db_session[10]) if db_session[10] else 0,
            )
        )

    return {"sessions": sessions}


@app.delete("/sessions/{session_id}")
async def delete_session_endpoint(session_id: str):
    """
    Delete a session by session_id.
    """
    await delete_session(session_id)
    return {"message": "Session deleted."}


# ==================================================================
# Links Based Upload
# ==================================================================
async def download_file_from_link(url, destination, username):
    """Download a file asynchronously from a URL to a destination."""
    # Get the file name from the URL
    file_name = Path(url).name
    file_path = Path(destination) / file_name

    session_id = str(uuid.uuid4())
    session = SessionStatus(
        session_id=session_id,
        type=SessionTypeEnum.sftp_download,
        status=SessionStatusEnum.queued,
        file_name=file_name,
        started_at=time.strftime("%Y-%m-%d %H:%M:%S"),
        started_at_unix=int(time.time()),
        uploaded_at=str(destination),
        username=username,
        progress=0,
    )
    await create_session(session)

    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            if response.status == 200:
                async with aiofiles.open(file_path, mode="wb") as f:
                    async for chunk in response.content.iter_chunked(1024):
                        current_session = await get_session(session_id)
                        if current_session[3] == SessionStatusEnum.failed or current_session is None:
                            break
                        await f.write(chunk)
                        await update_session_status(
                            session_id,
                            status=SessionStatusEnum.processing,
                            progress=(await f.tell()) * 100 // int(response.headers["Content-Length"]),
                        )

            if current_session[3] == SessionStatusEnum.failed or current_session is None:
                file_path.unlink(missing_ok=True)
            else:
                await update_session_status(
                    session_id, status=SessionStatusEnum.failed, details="Failed to download file."
                )
                return

    await update_session_status(session_id, status=SessionStatusEnum.completed)


@app.post("/links_upload/")
async def upload_files_from_links(
    background_tasks: BackgroundTasks,
    links_body: LinksUploadBody,
    current_user: str = Depends(get_current_user),
):
    """
    Download files from a list of URLs and upload them to the specified directory.
    """
    links = links_body.links
    current_path = links_body.path
    upload_dir = Path(current_path)

    if not upload_dir.is_dir():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid upload directory.")

    if not has_access_to_path(upload_dir, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied.")

    for link in links:
        background_tasks.add_task(download_file_from_link, link, upload_dir, current_user)

    return {"message": "Files are being downloaded and uploaded."}
