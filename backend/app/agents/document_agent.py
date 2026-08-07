"""Document Agent — reads uploaded PDF/DOCX/TXT content and extracts structure."""

from __future__ import annotations

from app.agents.base import AgentContext, AgentOutput, BaseAgent
from app.core.errors import InvalidInputError
from app.schemas.workflow import Capability, WorkflowNode

SYSTEM = (
    "You are the Document Agent in an agentic workflow system. You read the user's "
    "uploaded documents and extract exactly what later steps need. Never invent facts "
    "that are not present in the document. If something is missing, say it is missing."
)


class DocumentAgent(BaseAgent):
    capability = Capability.DOCUMENT
    name = "Document Agent"
    description = "Reads uploaded PDF/DOCX/TXT files and extracts relevant content."

    async def run(self, node: WorkflowNode, context: AgentContext) -> AgentOutput:
        if not context.documents:
            raise InvalidInputError(
                "This workflow step needs an uploaded document, but none was provided."
            )

        docs = "\n\n".join(
            f"=== DOCUMENT: {d.filename} ===\n{d.text}" for d in context.documents
        )
        focus = node.parameters.get("focus") or node.description or node.label

        prompt = (
            f"User objective: {context.objective}\n\n"
            f"This step: {node.label}\nFocus: {focus}\n\n"
            "Read the document(s) below and produce a faithful, structured extraction "
            "in markdown covering the facts relevant to the focus above:\n"
            "- key entities and identity details actually present\n"
            "- skills, experience, education, projects, metrics (whatever applies)\n"
            "- explicit gaps or missing information\n"
            "Quote or paraphrase only what the document states.\n\n"
            f"{docs}"
        )
        content = await self.gemini.generate(prompt, system=SYSTEM, temperature=0.2)
        return AgentOutput(
            content=content,
            summary=f"Extracted content from {len(context.documents)} document(s).",
        )
