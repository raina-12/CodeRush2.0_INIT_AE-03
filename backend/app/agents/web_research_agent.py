"""Web Research Agent — retrieves public web information and preserves source URLs."""

from __future__ import annotations

from app.agents.base import AgentContext, AgentOutput, BaseAgent
from app.core.errors import WebResearchError
from app.schemas.workflow import Capability, Source, WorkflowNode
from app.tools import web_search

SYSTEM = (
    "You are the Web Research Agent. You summarise ONLY the retrieved web sources "
    "given to you. Every factual statement must be attributable to one of the numbered "
    "sources and cited inline as [n]. Never add facts from memory. If the sources do "
    "not answer part of the question, state that explicitly."
)

class WebResearchAgent(BaseAgent):
    capability = Capability.WEB_RESEARCH
    name = "Web Research Agent"
    description = "Retrieves information from public web sources and keeps source URLs."

    async def run(self, node: WorkflowNode, context: AgentContext) -> AgentOutput:
        queries = node.parameters.get("queries")
        if isinstance(queries, str):
            queries = [queries]
        if not queries:
            single = node.parameters.get("query")
            queries = [single] if single else [node.label]

        hits: list[web_search.SearchHit] = []
        seen: set[str] = set()
        errors: list[str] = []
        for query in queries[:3]:
            try:
                for hit in await web_search.research(str(query)):
                    if hit.url not in seen:
                        seen.add(hit.url)
                        hits.append(hit)
            except WebResearchError as exc:
                errors.append(str(exc))

        # FIX: Graceful fallback instead of crashing the DAG
        if not hits:
            detail = " ".join(errors) or "No public pages could be retrieved."
            fallback_message = f"*(Note: Web research returned no usable content. {detail})*"
            return AgentOutput(
                content=fallback_message,
                summary="0 sources retrieved (Search failed or timed out).",
                sources=[]
            )

        corpus = "\n\n".join(
            f"[{i + 1}] {h.title}\nURL: {h.url}\n{h.text[:5000]}"
            for i, h in enumerate(hits)
        )
        prompt = (
            f"User objective: {context.objective}\n"
            f"Research step: {node.label}\n"
            f"Queries used: {', '.join(map(str, queries))}\n\n"
            "Write a factual research brief in markdown answering this step using only "
            "the sources below. Cite inline with [n]. Note explicitly anything the "
            "sources do not cover.\n\n"
            f"SOURCES:\n{corpus}"
        )
        content = await self.gemini.generate(prompt, system=SYSTEM, temperature=0.2)

        sources = [
            Source(title=h.title, url=h.url, snippet=(h.snippet or h.text[:200]))
            for h in hits
        ]
        return AgentOutput(
            content=content,
            summary=f"Retrieved {len(sources)} public source(s).",
            sources=sources,
        )