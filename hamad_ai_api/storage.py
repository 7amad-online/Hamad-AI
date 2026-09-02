"""Small PostgreSQL storage layer for Hamad AI."""

from __future__ import annotations

import os
from contextlib import contextmanager
from datetime import date, datetime
from typing import Any, Iterator

import psycopg
from psycopg.rows import dict_row


def _database_url() -> str:
    value = os.getenv("DATABASE_URL")
    if not value:
        raise RuntimeError("DATABASE_URL must be configured for persistent assistant data.")
    return value


@contextmanager
def _connection() -> Iterator[psycopg.Connection[Any]]:
    with psycopg.connect(_database_url(), row_factory=dict_row) as connection:
        yield connection


def _serialize(row: dict[str, Any] | None) -> dict[str, Any] | None:
    if row is None:
        return None
    result = dict(row)
    for key, value in result.items():
        if isinstance(value, (date, datetime)):
            result[key] = value.isoformat()
    return result


def list_tasks() -> list[dict[str, Any]]:
    with _connection() as connection:
        rows = connection.execute(
            """
            SELECT id, title, due_date, priority, status, created_at, updated_at
            FROM tasks
            ORDER BY due_date ASC,
              CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
              id DESC
            """
        ).fetchall()
    return [_serialize(row) for row in rows if row is not None]


def create_task(title: str, due_date: date, priority: str, status: str) -> dict[str, Any]:
    with _connection() as connection:
        row = connection.execute(
            """
            INSERT INTO tasks (title, due_date, priority, status)
            VALUES (%s, %s, %s, %s)
            RETURNING id, title, due_date, priority, status, created_at, updated_at
            """,
            (title, due_date, priority, status),
        ).fetchone()
    serialized = _serialize(row)
    if serialized is None:
        raise RuntimeError("Task was not created.")
    return serialized


def update_task(task_id: int, values: dict[str, Any]) -> dict[str, Any] | None:
    allowed_columns = {"title": "title", "due_date": "due_date", "priority": "priority", "status": "status"}
    updates = [(allowed_columns[key], value) for key, value in values.items() if key in allowed_columns]
    if not updates:
        return get_task(task_id)

    assignments = ", ".join(f"{column} = %s" for column, _ in updates)
    parameters = [value for _, value in updates] + [task_id]
    with _connection() as connection:
        row = connection.execute(
            f"""
            UPDATE tasks
            SET {assignments}, updated_at = NOW()
            WHERE id = %s
            RETURNING id, title, due_date, priority, status, created_at, updated_at
            """,
            parameters,
        ).fetchone()
    return _serialize(row)


def get_task(task_id: int) -> dict[str, Any] | None:
    with _connection() as connection:
        row = connection.execute(
            """
            SELECT id, title, due_date, priority, status, created_at, updated_at
            FROM tasks
            WHERE id = %s
            """,
            (task_id,),
        ).fetchone()
    return _serialize(row)


def delete_task(task_id: int) -> bool:
    with _connection() as connection:
        cursor = connection.execute("DELETE FROM tasks WHERE id = %s", (task_id,))
    return cursor.rowcount > 0


def list_reminders() -> list[dict[str, Any]]:
    with _connection() as connection:
        rows = connection.execute(
            """
            SELECT id, title, remind_at, completed, created_at, updated_at
            FROM reminders
            WHERE completed = false
            ORDER BY remind_at ASC, id ASC
            """
        ).fetchall()
    return [_serialize(row) for row in rows if row is not None]


def create_reminder(title: str, remind_at: datetime) -> dict[str, Any]:
    with _connection() as connection:
        row = connection.execute(
            """
            INSERT INTO reminders (title, remind_at)
            VALUES (%s, %s)
            RETURNING id, title, remind_at, completed, created_at, updated_at
            """,
            (title, remind_at),
        ).fetchone()
    serialized = _serialize(row)
    if serialized is None:
        raise RuntimeError("Reminder was not created.")
    return serialized


def update_reminder(reminder_id: int, completed: bool) -> dict[str, Any] | None:
    with _connection() as connection:
        row = connection.execute(
            """
            UPDATE reminders
            SET completed = %s, updated_at = NOW()
            WHERE id = %s
            RETURNING id, title, remind_at, completed, created_at, updated_at
            """,
            (completed, reminder_id),
        ).fetchone()
    return _serialize(row)


def delete_reminder(reminder_id: int) -> bool:
    with _connection() as connection:
        cursor = connection.execute("DELETE FROM reminders WHERE id = %s", (reminder_id,))
    return cursor.rowcount > 0


def today_tasks(today: date) -> list[dict[str, Any]]:
    with _connection() as connection:
        rows = connection.execute(
            """
            SELECT id, title, due_date, priority, status, created_at, updated_at
            FROM tasks
            WHERE due_date = %s
            ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, id ASC
            """,
            (today,),
        ).fetchall()
    return [_serialize(row) for row in rows if row is not None]


def create_conversation(title: str) -> dict[str, Any]:
    with _connection() as connection:
        row = connection.execute(
            """
            INSERT INTO conversations (title)
            VALUES (%s)
            RETURNING id, title, created_at, updated_at
            """,
            (title,),
        ).fetchone()
    serialized = _serialize(row)
    if serialized is None:
        raise RuntimeError("Conversation was not created.")
    return serialized


def list_conversations() -> list[dict[str, Any]]:
    with _connection() as connection:
        rows = connection.execute(
            """
            SELECT id, title, created_at, updated_at
            FROM conversations
            ORDER BY updated_at DESC, id DESC
            LIMIT 30
            """
        ).fetchall()
    return [_serialize(row) for row in rows if row is not None]


def get_conversation(conversation_id: int) -> dict[str, Any] | None:
    with _connection() as connection:
        row = connection.execute(
            """
            SELECT id, title, created_at, updated_at
            FROM conversations
            WHERE id = %s
            """,
            (conversation_id,),
        ).fetchone()
    return _serialize(row)


def add_message(conversation_id: int, role: str, content: str) -> dict[str, Any]:
    with _connection() as connection:
        row = connection.execute(
            """
            INSERT INTO messages (conversation_id, role, content)
            VALUES (%s, %s, %s)
            RETURNING id, conversation_id, role, content, created_at
            """,
            (conversation_id, role, content),
        ).fetchone()
        connection.execute(
            "UPDATE conversations SET updated_at = NOW() WHERE id = %s",
            (conversation_id,),
        )
    serialized = _serialize(row)
    if serialized is None:
        raise RuntimeError("Message was not saved.")
    return serialized


def list_messages(conversation_id: int, limit: int = 40) -> list[dict[str, Any]]:
    with _connection() as connection:
        rows = connection.execute(
            """
            SELECT id, conversation_id, role, content, created_at
            FROM (
              SELECT id, conversation_id, role, content, created_at
              FROM messages
              WHERE conversation_id = %s
              ORDER BY created_at DESC, id DESC
              LIMIT %s
            ) recent_messages
            ORDER BY created_at ASC, id ASC
            """,
            (conversation_id, limit),
        ).fetchall()
    return [_serialize(row) for row in rows if row is not None]


def get_settings() -> dict[str, Any]:
    with _connection() as connection:
        row = connection.execute(
            """
            INSERT INTO settings (id)
            VALUES (1)
            ON CONFLICT (id) DO UPDATE SET id = EXCLUDED.id
            RETURNING id, language, theme, assistant_name, updated_at
            """
        ).fetchone()
    serialized = _serialize(row)
    if serialized is None:
        raise RuntimeError("Settings are unavailable.")
    return serialized


def update_settings(values: dict[str, str]) -> dict[str, Any]:
    allowed_columns = {
        "language": "language",
        "theme": "theme",
        "assistant_name": "assistant_name",
    }
    updates = [(allowed_columns[key], value) for key, value in values.items() if key in allowed_columns]
    if not updates:
        return get_settings()

    assignments = ", ".join(f"{column} = %s" for column, _ in updates)
    parameters = [value for _, value in updates]
    with _connection() as connection:
        row = connection.execute(
            f"""
            INSERT INTO settings (id)
            VALUES (1)
            ON CONFLICT (id) DO UPDATE SET {assignments}, updated_at = NOW()
            RETURNING id, language, theme, assistant_name, updated_at
            """,
            parameters,
        ).fetchone()
    serialized = _serialize(row)
    if serialized is None:
        raise RuntimeError("Settings were not updated.")
    return serialized