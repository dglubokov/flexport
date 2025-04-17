import os
import stat
from pathlib import Path

import aioftp
import asyncssh
import aiofiles
from fastapi import logger

from flexport.models import SessionStatusEnum
from flexport.db import update_session_status


# ============================================================
# FTP
# ============================================================
async def list_files_ftp(host, username, password, port=21, path="/"):
    """Asynchronous list of files and directories with metadata from an FTP server."""
    async with aioftp.Client.context(host, port=port, user=username, password=password) as client:
        file_metadata = []
        async for path_info_tuple in client.list(path, recursive=False):
            path_ftp = str(path_info_tuple[0]).replace('/', '')
            path_info = path_info_tuple[1]
            file_metadata.append(
                {
                    "name": path_ftp,
                    "type": "directory" if path_info["type"] == "dir" else "file",
                    "size": int(path_info.get("size", 0)),
                    "modified_time": path_info.get("modify"),
                }
            )
        return file_metadata


async def download_ftp(
    host: str,
    username: str,
    password: str,
    remote_path: str,
    local_path: str,
    session_id: str,
    port: int = 21,
):
    """Asynchronous file download using FTP."""
    try:
        await update_session_status(session_id, SessionStatusEnum.processing)

        async with aioftp.Client.context(host, port=port, user=username, password=password) as client:
            is_file = await client.is_file(remote_path)
            if not is_file:
                await download_directory_ftp(host, username, password, remote_path, local_path)
            async with aiofiles.open(local_path, "wb") as local_file:
                async for block in client.download_stream(remote_path):
                    await local_file.write(block)

        await update_session_status(session_id, SessionStatusEnum.completed)
    except Exception as e:
        logger.logger.error(e)
        await update_session_status(session_id, SessionStatusEnum.failed, details=str(e))


async def download_directory_ftp(host, user, password, remote_path, local_path):
    local_path_dir = Path(local_path) / str(remote_path).split('/')[-1]
    async with aioftp.Client.context(host, user=user, password=password) as client:
        await client.download(remote_path, local_path_dir, write_into=True)


# ============================================================
# SFTP
# ============================================================
async def list_files_sftp(host, username, password, port=22, path="/"):
    """Asynchronous list of files and directories with metadata from an SFTP server."""
    async with asyncssh.connect(host, port=port, username=username, password=password, known_hosts=None) as conn:
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
    host: str,
    username: str,
    password: str,
    remote_path: str,
    local_path: str,
    session_id: str,
    port: int = 22,
):
    """Asynchronous file or folder download using SFTP."""
    try:
        await update_session_status(session_id, SessionStatusEnum.processing)

        async with asyncssh.connect(host, port=port, username=username, password=password, known_hosts=None) as conn:
            async with conn.start_sftp_client() as sftp:

                async def download_file(file_path, local_file_path):
                    processed_size = 0
                    total_size = (await sftp.stat(file_path)).size

                    async with aiofiles.open(local_file_path, "wb") as local_file:
                        async with sftp.open(file_path, "rb") as remote_file:
                            while True:
                                chunk = await remote_file.read(1024 * 64)
                                if not chunk:
                                    break
                                await local_file.write(chunk)
                                processed_size += len(chunk)
                                await update_session_status(
                                    session_id=session_id,
                                    status=SessionStatusEnum.processing,
                                    progress=(processed_size / total_size) * 100,
                                )

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

        await update_session_status(session_id, SessionStatusEnum.completed)
    except Exception as e:
        await update_session_status(session_id, SessionStatusEnum.failed, details=str(e))
