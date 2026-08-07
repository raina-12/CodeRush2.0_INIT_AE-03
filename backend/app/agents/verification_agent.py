"""Verification Agent — checks completeness, consistency and source support."""

from __future__ import annotations

import json

from app.agents.base import AgentContext, AgentOutput, BaseAgent
from app.schemas.workflow import Capability, VerificationReport, WorkflowNode

SYSTEM = (
    "You are the Verification Agent. You audit a draft answer against the material it "
    "was derived from. You never add new facts. You flag any claim that is not "
    "supported by the document content or the retrieved sources, and you never call "
    "something verified when its support is missing."
)

SCHEMA_HINT = """Return ONLY JSON with this shape:
{
  "verdict": "supported" | "partially_supported" | "unsupported",
  "completeness": 0-100,
  "consistency": 0-100,
  "source_support": 0-100,
  "unsupported_claims": ["..."],
  "gaps": ["..."],
  "notes": "short reviewer note"
}"""


class VerificationAgent(BaseAgent):
    capability = Capability.VERIFICATION
    name = "Verification Agent"
    description = "Checks completeness, consistency and source support of the result."

    async def run(self, node: WorkflowNode, context: AgentContext) -> AgentOutput:
        draft = context.upstream_text(node) or "(nothing to verify)"
        sources = context.all_sources()
        source_list = "\n".join(f"[{i + 1}] {s.title} — {s.url}" for i, s in enumerate(sources))
        has_docs = "yes" if context.documents else "no"

        prompt = (
            f"User objective: {context.objective}\n"
            f"Documents supplied by the user: {has_docs}\n\n"
            "Audit the draft below for (a) completeness against the objective, "
            "(b) internal consistency, and (c) support from the listed sources / "
            "document content.\n\n"
            f"DRAFT AND UPSTREAM MATERIAL:\n{draft}\n\n"
            f"SOURCES:\n{source_list or '(no web sources — document-only run)'}\n\n"
            f"{SCHEMA_HINT}"
        )
        payload = await self.gemini.generate_json(prompt, system=SYSTEM, temperature=0.1)
        if not isinstance(payload, dict):
            payload = {}
        report = VerificationReport(
            verdict=payload.get("verdict")
            if payload.get("verdict")
            in ("supported", "partially_supported", "unsupported")
            else "partially_supported",
            completeness=_pct(payload.get("completeness")),
            consistency=_pct(payload.get("consistency")),
            source_support=_pct(payload.get("source_support")),
            unsupported_claims=[str(x) for x in payload.get("unsupported_claims") or []],
            gaps=[str(x) for x in payload.get("gaps") or []],
            notes=str(payload.get("notes") or ""),
        )
        lines = [
            f"**Verdict:** {report.verdict.replace('_', ' ')}",
            f"Completeness {report.completeness}% · Consistency {report.consistency}% "
            f"· Source support {report.source_support}%",
        ]
        if report.unsupported_claims:
            lines.append("**Unsupported claims:** " + "; ".join(report.unsupported_claims))
        if report.gaps:
            lines.append("**Gaps:** " + "; ".join(report.gaps))
        if report.notes:
            lines.append(report.notes)

        return AgentOutput(
            content="\n\n".join(lines),
            summary=f"Verification verdict: {report.verdict}.",
            data={"verification": json.loads(report.model_dump_json())},
        )


def _pct(value: object) -> int:
    try:
        return max(0, min(100, int(float(value))))  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return 0
