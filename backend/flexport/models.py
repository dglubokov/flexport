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
    sftp_download = "SFTP Upload"
    ftp_download = "FTP Upload"
    link_download = "Link Upload"


class SessionStatus(BaseModel):
    session_id: str
    username: str
    type: SessionTypeEnum
    status: SessionStatusEnum
    file_name: str = ""
    started_at: str = ""
    started_at_unix: int = 0
    uploaded_at: str = ""
    completed_at: str = ""
    details: str = ""
    progress: int = 0


# Request models for listing and downloading
class SFTPRequest(BaseModel):
    host: str
    username: str
    password: str
    local_path: str
    local_user_id: str
    port: int = 22  # Default SFTP port
    path: str = "/"  # Default to root directory


class LinksUploadBody(BaseModel):
    links: list[str]
    path: str
