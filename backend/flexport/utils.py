import pam


def authenticate_user(username: str, password: str) -> bool:
    p = pam.pam()
    return p.authenticate(username, password)
