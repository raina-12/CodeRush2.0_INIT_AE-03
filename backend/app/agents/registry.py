"""Capability registry — the fixed, reusable capability set of AgentFlow."""

from __future__ import annotations

from app.agents.analysis_agent import AnalysisAgent
from app.agents.base import BaseAgent
from app.agents.document_agent import DocumentAgent
from app.agents.verification_agent import VerificationAgent
from app.agents.web_research_agent import WebResearchAgent
from app.schemas.workflow import Capability
from app.services.gemini_service import GeminiService, get_gemini_service

AGENT_CLASSES: dict[Capability, type[BaseAgent]] = {
    Capability.DOCUMENT: DocumentAgent,
    Capability.WEB_RESEARCH: WebResearchAgent,
    Capability.ANALYSIS: AnalysisAgent,
    Capability.VERIFICATION: VerificationAgent,
}


def capability_catalog() -> list[dict[str, str]]:
    return [
        {
            "capability": cap.value,
            "name": cls.name,
            "description": cls.description,
        }
        for cap, cls in AGENT_CLASSES.items()
    ]


class AgentRegistry:
    def __init__(self, gemini: GeminiService | None = None) -> None:
        gemini = gemini or get_gemini_service()
        self._agents = {cap: cls(gemini) for cap, cls in AGENT_CLASSES.items()}

    def get(self, capability: Capability) -> BaseAgent:
        return self._agents[capability]
