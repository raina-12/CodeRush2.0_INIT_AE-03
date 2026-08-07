"""HTTP API — see docs/api-contracts.md."""

from __future__ import annotations

import json
from collections.abc import AsyncIterator

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from app.agents.registry import capability_catalog
from app.core.config import get_settings
from app.core.errors import AgentFlowError
from app.core.logging import get_logger
from app.orchestration.orchestrator import Orchestrator
from app.schemas.workflow import DocumentInfo, HealthResponse, RunRequest
from app.services.document_store import get_document_store
from app.tools.file_parser import extract_text

logger = get_logger(__name__)
router = APIRouter(prefix="/api/v1")


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="ok",
        gemini_configured=settings.gemini_configured,
        model=settings.gemini_model,
        capabilities=[c["capability"] for c in capability_catalog()],
    )


@router.get("/capabilities")
async def capabilities() -> list[dict[str, str]]:
    return capability_catalog()


@router.post("/documents", response_model=DocumentInfo)
async def upload_document(file: UploadFile = File(...)) -> DocumentInfo:
    data = await file.read()
    try:
        text = extract_text(file.filename or "upload", data)
    except AgentFlowError as exc:
        raise HTTPException(
            status_code=exc.http_status, detail={"code": exc.code, "message": exc.message}
        ) from exc

    doc = get_document_store().add(
        filename=file.filename or "upload",
        content_type=file.content_type or "application/octet-stream",
        text=text,
    )
    return DocumentInfo(
        document_id=doc.document_id,
        filename=doc.filename,
        content_type=doc.content_type,
        characters=len(doc.text),
        preview=doc.text[:400],
    )


@router.post("/runs/stream")
async def run_stream(request: RunRequest) -> StreamingResponse:
    store = get_document_store()
    try:
        documents = store.get_many(request.document_ids)
    except AgentFlowError as exc:
        raise HTTPException(
            status_code=exc.http_status, detail={"code": exc.code, "message": exc.message}
        ) from exc

    orchestrator = Orchestrator()

    async def event_stream() -> AsyncIterator[bytes]:
        async for event in orchestrator.run(request.objective, documents):
            payload = json.dumps({"type": event.type, "data": event.data})
            yield f"data: {payload}\n\n".encode()
        yield b"data: {\"type\": \"done\", \"data\": {}}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
