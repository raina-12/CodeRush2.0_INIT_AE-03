"""Stage 2 + 3 — Task Planning and Capability Selection.

The planner decomposes the objective into subtasks and selects, for each subtask,
one of the four reusable capabilities. Nothing is task-specific or hardcoded:
different objectives yield different subtask graphs.
"""

from __future__ import annotations

from app.agents.registry import capability_catalog
from app.schemas.workflow import Capability, SubTask, TaskPlan, TaskUnderstanding
from app.services.gemini_service import GeminiService

SYSTEM = (
    "You are the planner of a dynamic agentic workflow system. You decompose an "
    "objective into a minimal directed acyclic graph of subtasks, and assign each "
    "subtask exactly one reusable capability. You never invent new capabilities."
)

PROMPT = """OBJECTIVE: {objective}
INTENT: {intent}
DELIVERABLES: {deliverables}
CONSTRAINTS: {constraints}
UPLOADED DOCUMENTS: {docs}
DOCUMENT CONTENT IS AVAILABLE: {needs_document}
EXTERNAL/PUBLIC INFORMATION LIKELY REQUIRED: {needs_web_research}

AVAILABLE CAPABILITIES (the only ones that exist):
{catalog}

Rules:
- Use ONLY the capability ids listed above.
- Use "document" only if uploaded documents are available.
- Use "web_research" only for information that must come from public web sources.
  Split independent research angles into PARALLEL web_research subtasks (no
  dependency between them) when that genuinely helps; each needs its own queries.
- Use "analysis" to reason over, compare or synthesize earlier outputs.
- Add exactly one subtask to create an executive summary. Its capability MUST strictly be "summarize" (do not use "analysis").
- End with exactly one "verification" subtask that depends on the summarize subtask.
- End with exactly one "verification" subtask that depends on the summarize subtask.
- Produce between 3 and 8 subtasks. Do not add steps that add no value.
- depends_on must reference earlier subtask ids only; the graph must be acyclic.
- ASSESS COMPLEXITY: Evaluate the objective and assign a "verbosity" level: "concise" (simple questions), "standard" (normal summaries), or "comprehensive" (deep research/reports).
Return ONLY JSON:
{{
  "rationale": "one or two sentences on why this shape of workflow",
  "verbosity": "concise|standard|comprehensive",
  "subtasks": [
    {{
      "id": "s1",
      "title": "short imperative title",
      "description": "what this step must produce",
      "capability": "document|web_research|analysis|summarize|verification",
      "depends_on": [],
      "parameters": {{
        "queries": ["only for web_research"],
        "focus": "only for document",
        "instruction": "only for analysis or summarize"
      }}
    }}
  ]
}}"""


class PlannerStage:
    def __init__(self, gemini: GeminiService) -> None:
        self.gemini = gemini

    async def run(
        self, understanding: TaskUnderstanding, document_names: list[str]
    ) -> TaskPlan:
        catalog = "\n".join(
            f"- {c['capability']}: {c['name']} — {c['description']}"
            for c in capability_catalog()
        )
        payload = await self.gemini.generate_json(
            PROMPT.format(
                objective=understanding.objective,
                intent=understanding.intent,
                deliverables=", ".join(understanding.deliverables) or "not specified",
                constraints=", ".join(understanding.constraints) or "none",
                docs=", ".join(document_names) or "none",
                needs_document=understanding.needs_document,
                needs_web_research=understanding.needs_web_research,
                catalog=catalog,
            ),
            system=SYSTEM,
        )
        if not isinstance(payload, dict):
            payload = {}

        subtasks: list[SubTask] = []
        known: set[str] = set()
        for index, raw in enumerate(payload.get("subtasks") or []):
            if not isinstance(raw, dict):
                continue
            capability = _capability(raw.get("capability"))
            title_str = str(raw.get("title") or "").lower()
            if capability is Capability.ANALYSIS and "summar" in title_str:
                capability = Capability.SUMMARIZE
            # ------------------------------
            if capability is None:
                continue
            if capability is Capability.DOCUMENT and not document_names:
                continue
            node_id = str(raw.get("id") or f"s{index + 1}").strip() or f"s{index + 1}"
            if node_id in known:
                node_id = f"{node_id}_{index}"
            depends = [
                str(d) for d in (raw.get("depends_on") or []) if str(d) in known
            ]
            params = raw.get("parameters") if isinstance(raw.get("parameters"), dict) else {}
            subtasks.append(
                SubTask(
                    id=node_id,
                    title=str(raw.get("title") or capability.value.replace("_", " ").title()),
                    description=str(raw.get("description") or ""),
                    capability=capability,
                    depends_on=depends,
                    parameters=_clean_params(capability, params or {}),
                )
            )
            known.add(node_id)

        verbosity_val = str(payload.get("verbosity") or "standard").strip().lower()
        if verbosity_val not in ("concise", "standard", "comprehensive"):
            verbosity_val = "standard"

        return TaskPlan(
            understanding=understanding,
            verbosity=verbosity_val, # <-- ADD THIS LINE
            subtasks=subtasks,
            rationale=str(payload.get("rationale") or ""),
        )


def _capability(value: object) -> Capability | None:
    try:
        return Capability(str(value).strip().lower())
    except ValueError:
        return None


def _clean_params(capability: Capability, params: dict) -> dict:
    if capability is Capability.WEB_RESEARCH:
        queries = params.get("queries") or params.get("query") or []
        if isinstance(queries, str):
            queries = [queries]
        return {"queries": [str(q) for q in queries if str(q).strip()][:3]}
    if capability is Capability.DOCUMENT:
        return {"focus": str(params.get("focus") or "")}
    if capability is Capability.ANALYSIS:
        return {"instruction": str(params.get("instruction") or "")}
    return {}
