from enum import Enum

from pydantic import BaseModel


class Credentials(BaseModel):
    username: str
    password: str


class SessionStatusEnum(str, Enum):
    queued = "Queued"
    processing = "Processing"
    completed = "Completed"
    failed = "Failed"


class SessionTypeEnum(str, Enum):
    sftp_download = "sftp_download"
    ftp_download = "ftp_download"
    link_download = "link_download"


class SessionStatus(BaseModel):
    session_id: str
    type: SessionTypeEnum
    status: SessionStatusEnum
    details: str = ""


# Request models for listing and downloading
class FTPRequest(BaseModel):
    host: str
    username: str
    password: str
    port: int = 21  # Default FTP port
    path: str = "/"  # Default to root directory


class SFTPRequest(BaseModel):
    host: str
    username: str
    password: str
    local_path: str
    local_user_id: str
    port: int = 22  # Default SFTP port
    path: str = "/"  # Default to root directory


class FTPDownloadRequest(FTPRequest):
    remote_path: str
    local_path: str