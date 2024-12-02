import os
import stat
import time

import aioftp
import asyncssh
import aiofiles

from flexport.models import SessionStatusEnum, SessionStatus


# ==============================
# FTP
# ==============================


async def list_files_ftp(host, username, password, port=21, path="/"):
    """Asynchronous list of files and directories with metadata from an FTP server."""
    try:
        async with aioftp.Client.context(host, port=port, user=username, password=password) as client:
            file_metadata = []
            async for path_info in client.list(path, recursive=False):
                file_metadata.append(
                    {
                        "name": path_info["name"],
                        "type": "directory" if path_info["type"] == "dir" else "file",
                        "size": path_info.get("size", 0),
                        "modified_time": path_info.get("modify"),
                    }
                )
            return file_metadata
    except Exception as e:
        print(f"FTP error: {e}")
        return None


async def download_ftp(
    sessions: dict[str, list[SessionStatus]],
    host: str,
    username: str,
    password: str,
    remote_path: str,
    local_path: str,
    session_id: str,
    local_user_id: str,
    port: int = 21,
):
    """Asynchronous file download using FTP."""
    try:
        session = next(s for s in sessions[local_user_id] if s.session_id == session_id)
        session.status = SessionStatusEnum.processing

        async with aioftp.Client.context(host, port=port, user=username, password=password) as client:
            async with aiofiles.open(local_path, "wb") as local_file:
                async for block in client.download_stream(remote_path):
                    await local_file.write(block)

        session.status = SessionStatusEnum.completed
        session.details = f"Downloaded {remote_path} to {local_path}."
    except Exception as e:
        session.status = SessionStatusEnum.failed
        session.details = str(e)


# ==============================
# SFTP
# ==============================


async def list_files_sftp(host, username, password, port=22, path="/"):
    """Asynchronous list of files and directories with metadata from an SFTP server."""
    async with asyncssh.connect(host, port=port, username=username, password=password) as conn:
        async with conn.start_sftp_client() as sftp:
            file_metadata = []
            for item in await sftp.listdir(path):
                item_path = os.path.join(path, item).replace("\\", "/")
                stat_item = await sftp.stat(item_path)
                file_metadata.append(
                    {
                        "name": item,
                        "type": "directory" if stat.S_ISDIR(stat_item.permissions) else "file",
                        "size": stat_item.size,
                        "modified_time": stat_item.mtime,
                        "permissions": oct(stat_item.permissions),
                    }
                )
            return file_metadata


async def download_sftp(
    sessions: dict[str, list[SessionStatus]],
    host: str,
    username: str,
    password: str,
    remote_path: str,
    local_path: str,
    session_id: str,
    local_user_id: str,
    port: int = 22,
):
    """Asynchronous file or folder download using SFTP."""
    try:
        session = next(s for s in sessions[local_user_id] if s.session_id == session_id)
        session.status = SessionStatusEnum.processing
        session.file_name = os.path.basename(remote_path)
        session.uploaded_at = remote_path

        async with asyncssh.connect(host, port=port, username=username, password=password) as conn:
            async with conn.start_sftp_client() as sftp:

                async def calculate_total_size(path):
                    if await sftp.isdir(path):
                        size = 0
                        for item in await sftp.listdir(path):
                            remote_item_path = os.path.join(path, item).replace("\\", "/")
                            size += await calculate_total_size(remote_item_path)
                        return size
                    else:
                        return (await sftp.stat(path)).size

                async def download_file(file_path, local_file_path):
                    processed_size = 0
                    total_size = await calculate_total_size(file_path)
                    async with aiofiles.open(local_file_path, "wb") as local_file:
                        async with sftp.open(file_path, "rb") as remote_file:
                            while True:
                                chunk = await remote_file.read(1024 * 64)
                                if not chunk:
                                    break
                                await local_file.write(chunk)
                                processed_size += len(chunk)
                                session.progress = round((processed_size / total_size) * 100, 2)

                async def download_folder(folder_path, local_folder_path):
                    os.makedirs(local_folder_path, exist_ok=True)
                    for item in await sftp.listdir(folder_path):
                        remote_item_path = os.path.join(folder_path, item).replace("\\", "/")
                        local_item_path = os.path.join(local_folder_path, item)
                        if await sftp.isdir(remote_item_path):
                            await download_folder(remote_item_path, local_item_path)
                        else:
                            await download_file(remote_item_path, local_item_path)

                if await sftp.isdir(remote_path):
                    await download_folder(remote_path, local_path)
                else:
                    if os.path.isdir(local_path):  # If `local_path` is a directory, append the file name
                        local_path = os.path.join(local_path, os.path.basename(remote_path))
                    await download_file(remote_path, local_path)

        session.status = SessionStatusEnum.completed
        session.details = f"Downloaded {remote_path} to {local_path}."
        session.completed_at = time.strftime("%Y-%m-%d %H:%M:%S")
    except Exception as e:
        session.status = SessionStatusEnum.failed
        session.details = str(e)
