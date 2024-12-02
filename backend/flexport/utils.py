import stat
from pwd import getpwnam
from pathlib import Path

import pam


def authenticate_user(username: str, password: str) -> bool:
    p = pam.pam()
    return p.authenticate(username, password)


def has_access_to_path(path: Path, current_user: str) -> bool:
    """
    Check if the current user has access to the specified path.
    """
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
