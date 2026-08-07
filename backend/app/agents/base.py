"""Agent contract shared by all reusable capabilities."""

from __future__ import annotations

import abc
from dataclasses import dataclass, field

from app.schemas.workflow import Capability, Source, WorkflowNode
from app.services.document_store import StoredDocument
from app.services.gemini_service import GeminiService


@dataclass
class AgentContext:
    """Everything an agent may read: the objective, documents and upstream outputs."""

    objective: str
    documents: list[StoredDocument] = field(default_factory=list)
    outputs: dict[str, "AgentOutput"] = field(default_factory=dict)

    def upstream(self, node: WorkflowNode) -> list["AgentOutput"]:
        return [self.outputs[d] for d in node.depends_on if d in self.outputs]

    def upstream_text(self, node: WorkflowNode, limit: int = 12000) -> str:
        blocks = []
        for dep in node.depends_on:
            out = self.outputs.get(dep)
            if out and out.content:
                blocks.append(f"### Output of step `{dep}`\n{out.content[:limit]}")
        return "\n\n".join(blocks)

    def all_sources(self) -> list[Source]:
        seen: set[str] = set()
        result: list[Source] = []
        for out in self.outputs.values():
            for src in out.sources:
                if src.url not in seen:
                    seen.add(src.url)
                    result.append(src)
        return result


@dataclass
class AgentOutput:
    content: str
    summary: str = ""
    sources: list[Source] = field(default_factory=list)
    data: dict = field(default_factory=dict)


class BaseAgent(abc.ABC):
    capability: Capability
    name: str
    description: str

    def __init__(self, gemini: GeminiService) -> None:
        self.gemini = gemini

    @abc.abstractmethod
    async def run(self, node: WorkflowNode, context: AgentContext) -> AgentOutput: ...
