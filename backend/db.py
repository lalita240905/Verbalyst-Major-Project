import asyncio
import json
import os
import uuid
from datetime import datetime
from typing import Any

import pymysql
from pymysql.cursors import DictCursor

MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "speech_analyzer")


def _connect(database: str | None = MYSQL_DATABASE):
    connection_kwargs = {
        "host": MYSQL_HOST,
        "port": MYSQL_PORT,
        "user": MYSQL_USER,
        "password": MYSQL_PASSWORD,
        "charset": "utf8mb4",
        "autocommit": True,
        "cursorclass": DictCursor,
    }
    if database:
        connection_kwargs["database"] = database
    return pymysql.connect(**connection_kwargs)


def _initialize_storage_sync() -> None:
    schema_sql = """
    CREATE TABLE IF NOT EXISTS sessions (
        id CHAR(36) NOT NULL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        created_at DATETIME(6) NOT NULL,
        language VARCHAR(32) NOT NULL,
        language_probability DOUBLE NOT NULL,
        processing_time DOUBLE NOT NULL,
        total_pipeline_time DOUBLE NOT NULL,
        word_count INT NOT NULL,
        duration DOUBLE NOT NULL,
        energy_sparkline JSON NOT NULL,
        segments JSON NOT NULL,
        words JSON NOT NULL,
        acoustics JSON NOT NULL,
        fused JSON NOT NULL,
        KEY idx_sessions_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """

    with _connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute(schema_sql)


async def initialize_storage() -> None:
    await asyncio.to_thread(_initialize_storage_sync)


def _jsonify(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False)


def _maybe_load_json(value: Any) -> Any:
    if isinstance(value, str):
        return json.loads(value)
    return value


def _serialize_session(session: dict[str, Any]) -> dict[str, Any]:
    serialized = dict(session)
    serialized["_id"] = str(serialized.pop("id"))

    created_at = serialized.get("created_at")
    if isinstance(created_at, datetime):
        serialized["created_at"] = created_at.isoformat()

    for key in ("energy_sparkline", "segments", "words", "acoustics", "fused"):
        if key in serialized:
            serialized[key] = _maybe_load_json(serialized[key])

    return serialized


def _insert_session_sync(data: dict[str, Any]) -> str:
    session_id = str(uuid.uuid4())
    payload = {
        "id": session_id,
        "filename": data["filename"],
        "created_at": datetime.utcnow(),
        "language": data["language"],
        "language_probability": data["language_probability"],
        "processing_time": data["processing_time"],
        "total_pipeline_time": data["total_pipeline_time"],
        "word_count": data["word_count"],
        "duration": data["duration"],
        "energy_sparkline": _jsonify(data["energy_sparkline"]),
        "segments": _jsonify(data["segments"]),
        "words": _jsonify(data["words"]),
        "acoustics": _jsonify(data["acoustics"]),
        "fused": _jsonify(data["fused"]),
    }

    query = """
    INSERT INTO sessions (
        id,
        filename,
        created_at,
        language,
        language_probability,
        processing_time,
        total_pipeline_time,
        word_count,
        duration,
        energy_sparkline,
        segments,
        words,
        acoustics,
        fused
    ) VALUES (
        %(id)s,
        %(filename)s,
        %(created_at)s,
        %(language)s,
        %(language_probability)s,
        %(processing_time)s,
        %(total_pipeline_time)s,
        %(word_count)s,
        %(duration)s,
        %(energy_sparkline)s,
        %(segments)s,
        %(words)s,
        %(acoustics)s,
        %(fused)s
    )
    """

    with _connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, payload)

    return session_id


async def insert_session(data: dict[str, Any]) -> str:
    return await asyncio.to_thread(_insert_session_sync, data)


def _get_all_sessions_sync() -> list[dict[str, Any]]:
    query = """
    SELECT
        id,
        filename,
        created_at,
        language,
        language_probability,
        processing_time,
        total_pipeline_time,
        word_count,
        duration,
        energy_sparkline
    FROM sessions
    ORDER BY created_at DESC
    """

    with _connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query)
            rows = cursor.fetchall()

    return [_serialize_session(row) for row in rows]


async def get_all_sessions() -> list[dict[str, Any]]:
    return await asyncio.to_thread(_get_all_sessions_sync)


def _get_session_by_id_sync(session_id: str) -> dict[str, Any] | None:
    query = "SELECT * FROM sessions WHERE id = %s LIMIT 1"

    with _connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, (session_id,))
            row = cursor.fetchone()

    if row is None:
        return None
    return _serialize_session(row)


async def get_session_by_id(session_id: str) -> dict[str, Any] | None:
    return await asyncio.to_thread(_get_session_by_id_sync, session_id)


def _delete_session_by_id_sync(session_id: str) -> bool:
    query = "DELETE FROM sessions WHERE id = %s"

    with _connect() as connection:
        with connection.cursor() as cursor:
            affected_rows = cursor.execute(query, (session_id,))

    return affected_rows > 0


async def delete_session_by_id(session_id: str) -> bool:
    return await asyncio.to_thread(_delete_session_by_id_sync, session_id)