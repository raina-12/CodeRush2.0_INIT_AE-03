"""Stage 1 — Task Understanding."""

from __future__ import annotations

from app.core.errors import InvalidInputError
from app.schemas.workflow import TaskUnderstanding
from app.services.gemini_service import GeminiService

SYSTEM = (
    "You are the task-understanding stage of a dynamic agentic workflow system. "
    "You interpret a user's natural-language objective. You do not answer it."
)

PROMPT = """User objective:
\"\"\"{objective}\"\"\"

Documents uploaded by the user: {docs}

Analyse what the user actually wants. Return ONLY JSON:
{{
  "intent": "one sentence describing the real goal",
  "domain": "short domain label",
  "deliverables": ["concrete outputs the user expects"],
  "constraints": ["explicit constraints or preferences, may be empty"],
  "needs_document": true|false,
  "needs_web_research": true|false,
  "clarifications": ["anything genuinely ambiguous, may be empty"]
}}

needs_document is true only when uploaded documents exist and are relevant.
needs_web_research is true when the objective depends on external, current, or
public-world information that is not in the uploaded documents."""


class TaskUnderstandingStage:
    def __init__(self, gemini: GeminiService) -> None:
        self.gemini = gemini

    async def run(self, objective: str, document_names: list[str]) -> TaskUnderstanding:
        objective = (objective or "").strip()
        if len(objective) < 3:
            raise InvalidInputError("Please describe what you want AgentFlow to do.")

        docs = ", ".join(document_names) if document_names else "none"
        payload = await self.gemini.generate_json(
            PROMPT.format(objective=objective, docs=docs), system=SYSTEM
        )
        if not isinstance(payload, dict):
            payload = {}

        needs_doc = bool(payload.get("needs_document")) and bool(document_names)
        return TaskUnderstanding(
            objective=objective,
            intent=str(payload.get("intent") or objective),
            domain=str(payload.get("domain") or ""),
            deliverables=[str(x) for x in payload.get("deliverables") or []],
            constraints=[str(x) for x in payload.get("constraints") or []],
            needs_document=needs_doc,
            needs_web_research=bool(payload.get("needs_web_research")),
            clarifications=[str(x) for x in payload.get("clarifications") or []],
        )
