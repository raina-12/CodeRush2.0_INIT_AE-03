"""API + orchestration schemas. These are the contracts shared with the frontend."""

from __future__ import annotations

from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field


class Capability(str, Enum):
    """The only reusable capabilities in the system."""

    DOCUMENT = "document"
    WEB_RESEARCH = "web_research"
    ANALYSIS = "analysis"
    VERIFICATION = "verification"


class NodeStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


# --------------------------------------------------------------------------
# Task understanding + planning
# --------------------------------------------------------------------------


class TaskUnderstanding(BaseModel):
    objective: str
    intent: str
    domain: str = ""
    deliverables: list[str] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    needs_document: bool = False
    needs_web_research: bool = False
    clarifications: list[str] = Field(default_factory=list)


class SubTask(BaseModel):
    id: str
    title: str
    description: str
    capability: Capability
    depends_on: list[str] = Field(default_factory=list)
    # Capability-specific input (e.g. search query for web research)
    parameters: dict[str, Any] = Field(default_factory=dict)


class TaskPlan(BaseModel):
    understanding: TaskUnderstanding
    subtasks: list[SubTask]
    rationale: str = ""


# --------------------------------------------------------------------------
# Workflow graph
# --------------------------------------------------------------------------


class WorkflowNode(BaseModel):
    id: str
    label: str
    capability: Capability
    description: str = ""
    depends_on: list[str] = Field(default_factory=list)
    parameters: dict[str, Any] = Field(default_factory=dict)
    status: NodeStatus = NodeStatus.PENDING


class WorkflowEdge(BaseModel):
    id: str
    source: str
    target: str


class Workflow(BaseModel):
    id: str
    objective: str
    nodes: list[WorkflowNode]
    edges: list[WorkflowEdge]
    understanding: TaskUnderstanding
    rationale: str = ""


class ExaminationIssue(BaseModel):
    severity: Literal["error", "warning"]
    message: str
    node_id: str | None = None


class ExaminationReport(BaseModel):
    valid: bool
    issues: list[ExaminationIssue] = Field(default_factory=list)
    repaired: bool = False
    notes: list[str] = Field(default_factory=list)


# --------------------------------------------------------------------------
# Execution
# --------------------------------------------------------------------------


class Source(BaseModel):
    title: str
    url: str
    snippet: str = ""


class NodeResult(BaseModel):
    node_id: str
    capability: Capability
    status: NodeStatus
    output: str = ""
    summary: str = ""
    sources: list[Source] = Field(default_factory=list)
    error: str | None = None
    duration_ms: int = 0


class VerificationReport(BaseModel):
    verdict: Literal["supported", "partially_supported", "unsupported"]
    completeness: int = 0
    consistency: int = 0
    source_support: int = 0
    unsupported_claims: list[str] = Field(default_factory=list)
    gaps: list[str] = Field(default_factory=list)
    notes: str = ""


class RunResult(BaseModel):
    run_id: str
    objective: str
    answer: str
    verification: VerificationReport | None = None
    sources: list[Source] = Field(default_factory=list)
    node_results: list[NodeResult] = Field(default_factory=list)


# --------------------------------------------------------------------------
# API request / response
# --------------------------------------------------------------------------


class DocumentInfo(BaseModel):
    document_id: str
    filename: str
    content_type: str
    characters: int
    preview: str


class RunRequest(BaseModel):
    objective: str = Field(min_length=3, max_length=4000)
    document_ids: list[str] = Field(default_factory=list)


class HealthResponse(BaseModel):
    status: str
    gemini_configured: bool
    model: str
    capabilities: list[str]


class ErrorResponse(BaseModel):
    code: str
    message: str


# --------------------------------------------------------------------------
# Streaming events (SSE)
# --------------------------------------------------------------------------


class StreamEvent(BaseModel):
    """`data` payload shape depends on `type` — see docs/api-contracts.md."""

    type: Literal[
        "understanding",
        "plan",
        "workflow",
        "examination",
        "node_update",
        "final",
        "error",
    ]
    data: dict[str, Any]
