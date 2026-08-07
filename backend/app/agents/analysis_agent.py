"""Analysis Agent — reasoning, comparison, summarization and synthesis."""

from __future__ import annotations

from app.agents.base import AgentContext, AgentOutput, BaseAgent
from app.schemas.workflow import Capability, WorkflowNode

SYSTEM = (
    "You are the Analysis Agent. You reason over the outputs of previous steps to "
    "produce the deliverable the user asked for. Ground every claim in the provided "
    "material, keep inline citations [n] and URLs that came from research steps, and "
    "clearly mark anything that is an inference rather than a stated fact."
)


class AnalysisAgent(BaseAgent):
    capability = Capability.ANALYSIS
    name = "Analysis Agent"
    description = "Reasons, compares, summarizes and synthesizes upstream outputs."

    async def run(self, node: WorkflowNode, context: AgentContext) -> AgentOutput:
        upstream = context.upstream_text(node) or "(no upstream output)"
        sources = context.all_sources()
        source_list = "\n".join(f"[{i + 1}] {s.title} — {s.url}" for i, s in enumerate(sources))
        instruction = node.parameters.get("instruction") or node.description or node.label

        prompt = (
            f"User objective: {context.objective}\n\n"
            f"This analysis step: {node.label}\n"
            f"What to produce: {instruction}\n\n"
            "Write the result in clear markdown with headings and concrete, specific "
            "content. Do not invent facts or sources.\n\n"
            f"UPSTREAM MATERIAL:\n{upstream}\n\n"
            f"AVAILABLE SOURCES:\n{source_list or '(none — document-only analysis)'}"
        )
        content = await self.gemini.generate(prompt, system=SYSTEM, temperature=0.35)
        return AgentOutput(content=content, summary="Analysis complete.")
