import datetime

import sqlite3
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

SECRET_KEY = "heiSais2heiSais2"  # Replace with a secure secret key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
DATABASE_PATH = "./tokens.db"


def init_db():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tokens (
        token TEXT PRIMARY KEY,
        username TEXT,
        expiry DATETIME
    )
    """)
    conn.commit()
    conn.close()


init_db()


security = HTTPBearer()


def create_access_token(data: dict, expires_delta: int = ACCESS_TOKEN_EXPIRE_MINUTES):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=expires_delta or ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    save_token(encoded_jwt, data["sub"], expire)
    return encoded_jwt


def save_token(token: str, username: str, expiry: datetime.datetime):
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO tokens (token, username, expiry) VALUES (?, ?, ?)",
        (token, username, expiry),
    )
    conn.commit()
    conn.close()


def get_saved_token(token: str) -> dict | None:
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT username, expiry FROM tokens WHERE token = ?", (token,))
    result = cursor.fetchone()
    conn.close()
    if result:
        return {"username": result[0], "expiry": result[1]}
    return None


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        # Check if token is in the database
        token_data = get_saved_token(token)
        if not token_data or token_data["username"] != username:
            raise credentials_exception
        return username
    except jwt.PyJWTError:
        raise credentials_exception