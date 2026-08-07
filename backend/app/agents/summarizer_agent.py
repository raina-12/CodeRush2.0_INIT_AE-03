"""Summarizer Agent — creates a concise executive summary of upstream text."""

from __future__ import annotations

from app.agents.base import AgentContext, AgentOutput, BaseAgent
from app.schemas.workflow import Capability, WorkflowNode

class SummarizerAgent(BaseAgent):
    capability = Capability.SUMMARIZE # We will add this to workflow.py next
    name = "Summarizer Agent"
    description = "Creates a highly concise executive summary of upstream outputs."

    async def run(self, node: WorkflowNode, context: AgentContext) -> AgentOutput:
        upstream = context.upstream_text(node) or "(no upstream output)"
        
        prompt = (
            f"User objective: {context.objective}\n\n"
            "Create a highly concise executive summary of the following text.\n\n"
            "=== FORMAT REQUIREMENT ===\n"
            "1.TL;DR (Maximum 3 short bullet points)\n"
            "2.Core Findings (2-3 key highlights)\n"
            "Do not output lengthy paragraphs. Keep it extremely punchy.\n"
            "==========================\n\n"
            f"TEXT TO SUMMARIZE:\n{upstream}"
        )
        content = await self.gemini.generate(prompt, temperature=0.2)
        return AgentOutput(content=content, summary="Executive summary generated.")