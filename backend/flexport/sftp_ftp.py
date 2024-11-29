import os
import stat
import ftplib
import paramiko
import asyncssh
import aiofiles

from flexport.models import SessionStatusEnum, SessionStatus


def list_files_ftp(host, username, password, port=21, path="/"):
    """List files and directories with metadata from an FTP server."""
    try:
        with ftplib.FTP() as ftp:
            ftp.connect(host, port)
            ftp.login(username, password)
            ftp.cwd(path)
            file_metadata = []

            # Use MLSD if supported for more detailed file info
            try:
                ftp.sendcmd("TYPE I")  # Set binary transfer mode for size calculation
                file_metadata = [
                    {"name": entry[0], "type": entry[1].get("type", "unknown"), "size": entry[1].get("size", 0)}
                    for entry in ftp.mlsd(path)
                ]
            except ftplib.error_perm:
                # Fallback if MLSD is not supported
                file_metadata = [{"name": filename, "type": "unknown"} for filename in ftp.nlst()]

            return file_metadata
    except ftplib.all_errors as e:
        print(f"FTP error: {e}")
        return None


def list_files_sftp(host, username, password, port=22, path="/"):
    """List files and directories with metadata from an SFTP server."""
    try:
        transport = paramiko.Transport((host, port))
        transport.connect(username=username, password=password)
        sftp = paramiko.SFTPClient.from_transport(transport)
        file_metadata = []

        for item in sftp.listdir_attr(path):
            file_metadata.append(
                {
                    "name": item.filename,
                    "type": "directory" if stat.S_ISDIR(item.st_mode) else "file",
                    "size": item.st_size,
                    "modified_time": item.st_mtime,
                    "permissions": oct(item.st_mode),
                }
            )

        sftp.close()
        transport.close()
        return file_metadata
    except paramiko.SSHException as e:
        print(f"SFTP error: {e}")
        return None


def download_ftp(host, username, password, remote_path, local_path, port=21):
    """Download a file or folder from an FTP server."""
    try:
        with ftplib.FTP() as ftp:
            ftp.connect(host, port)
            ftp.login(username, password)
            with open(local_path, "wb") as f:
                ftp.retrbinary(f"RETR {remote_path}", f.write)
        print(f"Downloaded {remote_path} to {local_path}.")
    except ftplib.all_errors as e:
        print(f"FTP error: {e}")


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

        async with asyncssh.connect(host, port=port, username=username, password=password) as conn:
            async with conn.start_sftp_client() as sftp:

                async def download_file(file_path, local_file_path):
                    async with aiofiles.open(local_file_path, "wb") as local_file:
                        async with sftp.open(file_path, "rb") as remote_file:
                            while True:
                                chunk = await remote_file.read(1024 * 64)
                                if not chunk:
                                    break
                                await local_file.write(chunk)

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
    except Exception as e:
        session.status = SessionStatusEnum.failed
        session.details = str(e)
