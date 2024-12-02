import aiosqlite
import time
from flexport.models import SessionStatus, SessionStatusEnum

DATABASE_PATH = "db.db"


async def init_db():
    """
    Initialize the database with tables for tokens and sessions.
    """
    async with aiosqlite.connect(DATABASE_PATH) as conn:
        # Enable write-ahead logging for better concurrency
        await conn.execute("PRAGMA journal_mode=WAL;")
        await conn.execute("PRAGMA synchronous=NORMAL;")

        await conn.execute("""
        CREATE TABLE IF NOT EXISTS tokens (
            token TEXT PRIMARY KEY,
            username TEXT,
            expiry DATETIME
        )
        """)

        await conn.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT PRIMARY KEY,
            username TEXT,
            type TEXT,
            status TEXT,
            file_name TEXT,
            started_at TEXT,
            started_at_unix INTEGER,
            uploaded_at TEXT,
            completed_at TEXT,
            details TEXT,
            progress INTEGER
        )
        """)

        # Add indexes for faster queries
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions (status);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_sessions_username ON sessions (username);")

        await conn.commit()


async def create_session(session: SessionStatus):
    """
    Add a new session to the database.
    """
    async with aiosqlite.connect(DATABASE_PATH) as conn:
        await conn.execute(
            """
            INSERT INTO sessions (
                session_id, username, type, status, file_name, started_at, 
                started_at_unix, uploaded_at, completed_at, details, progress
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                session.session_id,
                session.username,
                session.type.value,
                session.status.value,
                session.file_name,
                session.started_at,
                session.started_at_unix,
                session.uploaded_at,
                session.completed_at,
                session.details,
                session.progress,
            ),
        )
        await conn.commit()


async def update_session_status(session_id: str, status: SessionStatusEnum, details: str = "", progress: int = 0):
    """
    Update the status, details, and progress of a session.
    """
    async with aiosqlite.connect(DATABASE_PATH) as conn:
        await conn.execute(
            """
            UPDATE sessions
            SET status = ?, details = ?, progress = ?, completed_at = ?
            WHERE session_id = ?
            """,
            (
                status.value,
                details,
                progress,
                time.strftime("%Y-%m-%d %H:%M:%S") if status == SessionStatusEnum.completed else None,
                session_id,
            ),
        )
        await conn.commit()


async def delete_session(session_id: str):
    """
    Delete a session by session_id.
    """
    async with aiosqlite.connect(DATABASE_PATH) as conn:
        await conn.execute("DELETE FROM sessions WHERE session_id = ?", (session_id,))
        await conn.commit()


async def get_user_sessions(username: str):
    """
    Get all sessions for a specific user.
    """
    async with aiosqlite.connect(DATABASE_PATH) as conn:
        async with conn.execute("SELECT * FROM sessions WHERE username = ?", (username,)) as cursor:
            return await cursor.fetchall()


async def get_session(session_id: str):
    """
    Get a session by session_id.
    """
    async with aiosqlite.connect(DATABASE_PATH) as conn:
        async with conn.execute("SELECT * FROM sessions WHERE session_id = ?", (session_id,)) as cursor:
            return await cursor.fetchone()
