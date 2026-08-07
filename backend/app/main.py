"""FastAPI application entrypoint: `uvicorn app.main:app --reload --port 8000`."""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router
from app.core.config import get_settings
from app.core.errors import AgentFlowError
from app.core.logging import configure_logging, get_logger

configure_logging()
logger = get_logger(__name__)

settings = get_settings()

app = FastAPI(
    title="AgentFlow API",
    version="1.0.0",
    description="Dynamic agentic workflow system (understand → plan → generate → "
    "examine → execute → verify).",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.exception_handler(AgentFlowError)
async def agentflow_error_handler(_: Request, exc: AgentFlowError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.http_status, content={"code": exc.code, "message": exc.message}
    )


@app.get("/")
async def root() -> dict[str, str]:
    return {"service": "agentflow", "docs": "/docs", "health": "/api/v1/health"}
