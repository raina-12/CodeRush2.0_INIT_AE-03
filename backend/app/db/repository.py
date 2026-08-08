"""Database operations for AgentFlow runs."""

from datetime import datetime, timezone
from typing import Any

from app.db.mongo import get_db

async def create_run(run_id: str, objective: str) -> None:
    """Create a new run document in the database."""
    db = get_db()
    doc = {
        "_id": run_id,
        "objective": objective,
        "status": "running",
        "created_at": datetime.now(timezone.utc),
        "node_results": [],
    }
    await db.runs.insert_one(doc)

async def update_run_plan(run_id: str, understanding: dict, workflow: dict) -> None:
    """Save the initial plan (understanding and workflow)."""
    db = get_db()
    await db.runs.update_one(
        {"_id": run_id},
        {
            "$set": {
                "understanding": understanding,
                "workflow": workflow,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

async def append_node_result(run_id: str, node_result: dict) -> None:
    """Append a completed node result to the run's array."""
    db = get_db()
    await db.runs.update_one(
        {"_id": run_id},
        {
            "$push": {"node_results": node_result},
            "$set": {"updated_at": datetime.now(timezone.utc)},
        },
    )

async def complete_run(run_id: str, final_result: dict) -> None:
    """Mark the run as completed and save the final answer."""
    db = get_db()
    await db.runs.update_one(
        {"_id": run_id},
        {
            "$set": {
                "status": "completed",
                "final_result": final_result,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

async def fail_run(run_id: str, error_msg: str) -> None:
    """Mark the run as failed."""
    db = get_db()
    await db.runs.update_one(
        {"_id": run_id},
        {
            "$set": {
                "status": "failed",
                "error": error_msg,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )


async def save_document(doc_id: str, filename: str, content_type: str, size_bytes: int, chars: int) -> None:
    """Save metadata for an uploaded document."""
    db = get_db()
    doc = {
        "_id": doc_id,
        "filename": filename,
        "content_type": content_type,
        "size_bytes": size_bytes,
        "chars": chars,
        "uploaded_at": datetime.now(timezone.utc),
    }
    await db.documents.insert_one(doc)

async def get_run(run_id: str) -> dict | None:
    """Fetch a complete run document for a shareable link."""
    db = get_db()
    return await db.runs.find_one({"_id": run_id})