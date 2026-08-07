"""Offline tests: a stubbed Gemini service drives the full orchestration pipeline.

These verify that DIFFERENT objectives produce DIFFERENT workflow graphs and that
the graph is validated, repaired and executed correctly — without any network call.
"""

from __future__ import annotations

import json

import pytest

from app.agents.base import AgentContext
from app.orchestration.examiner import examine
from app.orchestration.executor import WorkflowExecutor, pick_answer
from app.orchestration.generator import generate_workflow, topological_levels
from app.orchestration.planner import PlannerStage
from app.orchestration.understanding import TaskUnderstandingStage
from app.schemas.workflow import Capability, NodeStatus, TaskPlan, TaskUnderstanding
from app.services.document_store import StoredDocument
from app.services.gemini_service import parse_json


class StubGemini:
    """Returns canned JSON for planning stages and plain text for agents."""

    configured = True

    def __init__(self, plan_payload: dict, understanding_payload: dict) -> None:
        self.plan_payload = plan_payload
        self.understanding_payload = understanding_payload
        self.calls: list[str] = []

    async def generate(self, prompt, *, system=None, temperature=0.3, json_mode=False):
        self.calls.append(prompt[:40])
        return "Generated content for the step."

    async def generate_json(self, prompt, *, system=None, temperature=0.2):
        if "Analyse what the user actually wants" in prompt:
            return self.understanding_payload
        if "AVAILABLE CAPABILITIES" in prompt:
            return self.plan_payload
        return {
            "verdict": "partially_supported",
            "completeness": 80,
            "consistency": 90,
            "source_support": 60,
            "unsupported_claims": [],
            "gaps": ["No web sources for salary data."],
            "notes": "Mostly grounded.",
        }


RESUME_PLAN = {
    "rationale": "Document-driven analysis.",
    "subtasks": [
        {"id": "s1", "title": "Read resume", "capability": "document", "depends_on": [],
         "parameters": {"focus": "skills"}},
        {"id": "s2", "title": "Analyse fit", "capability": "analysis", "depends_on": ["s1"],
         "parameters": {"instruction": "identify strengths"}},
        {"id": "s3", "title": "Verify", "capability": "verification", "depends_on": ["s2"]},
    ],
}

NVIDIA_PLAN = {
    "rationale": "Parallel research branches.",
    "subtasks": [
        {"id": "r1", "title": "Research products", "capability": "web_research",
         "depends_on": [], "parameters": {"queries": ["NVIDIA AI products"]}},
        {"id": "r2", "title": "Research competitors", "capability": "web_research",
         "depends_on": [], "parameters": {"queries": ["NVIDIA competitors"]}},
        {"id": "a1", "title": "Synthesize", "capability": "analysis",
         "depends_on": ["r1", "r2"], "parameters": {"instruction": "synthesize"}},
        {"id": "v1", "title": "Verify", "capability": "verification", "depends_on": ["a1"]},
    ],
}


async def build_workflow(plan_payload, understanding_payload, doc_names):
    gemini = StubGemini(plan_payload, understanding_payload)
    understanding = await TaskUnderstandingStage(gemini).run("objective text", doc_names)
    plan = await PlannerStage(gemini).run(understanding, doc_names)
    workflow = generate_workflow(plan)
    report = examine(workflow, has_documents=bool(doc_names))
    return gemini, workflow, report


@pytest.mark.asyncio
async def test_document_objective_builds_document_analysis_verification():
    _, workflow, report = await build_workflow(
        RESUME_PLAN,
        {"intent": "resume review", "needs_document": True, "needs_web_research": False},
        ["resume.pdf"],
    )
    assert report.valid
    assert [n.capability for n in workflow.nodes] == [
        Capability.DOCUMENT,
        Capability.ANALYSIS,
        Capability.VERIFICATION,
    ]


@pytest.mark.asyncio
async def test_research_objective_builds_parallel_branches():
    _, workflow, report = await build_workflow(
        NVIDIA_PLAN,
        {"intent": "company research", "needs_document": False, "needs_web_research": True},
        [],
    )
    assert report.valid
    levels = topological_levels(workflow)
    assert len(levels[0]) == 2  # two parallel research branches
    assert workflow.nodes[-1].capability is Capability.VERIFICATION


@pytest.mark.asyncio
async def test_different_objectives_produce_different_graphs():
    _, doc_wf, _ = await build_workflow(
        RESUME_PLAN,
        {"intent": "resume", "needs_document": True, "needs_web_research": False},
        ["resume.pdf"],
    )
    _, web_wf, _ = await build_workflow(
        NVIDIA_PLAN,
        {"intent": "research", "needs_document": False, "needs_web_research": True},
        [],
    )
    assert [n.capability for n in doc_wf.nodes] != [n.capability for n in web_wf.nodes]


@pytest.mark.asyncio
async def test_document_steps_removed_when_no_file_uploaded():
    _, workflow, report = await build_workflow(
        RESUME_PLAN,
        {"intent": "resume", "needs_document": True, "needs_web_research": False},
        [],
    )
    assert all(n.capability is not Capability.DOCUMENT for n in workflow.nodes)
    assert report.valid


@pytest.mark.asyncio
async def test_examiner_appends_missing_verification_step():
    plan = TaskPlan(
        understanding=TaskUnderstanding(objective="x", intent="x"),
        subtasks=[],
    )
    workflow = generate_workflow(plan)
    workflow.nodes.append(
        generate_workflow(
            TaskPlan(
                understanding=TaskUnderstanding(objective="x", intent="x"),
                subtasks=[
                    __import__("app.schemas.workflow", fromlist=["SubTask"]).SubTask(
                        id="a", title="Analyse", description="", capability=Capability.ANALYSIS
                    )
                ],
            )
        ).nodes[0]
    )
    report = examine(workflow, has_documents=False)
    assert report.valid and report.repaired
    assert workflow.nodes[-1].capability is Capability.VERIFICATION


@pytest.mark.asyncio
async def test_execution_runs_document_workflow_end_to_end():
    gemini, workflow, _ = await build_workflow(
        RESUME_PLAN,
        {"intent": "resume", "needs_document": True, "needs_web_research": False},
        ["resume.pdf"],
    )
    from app.agents.registry import AgentRegistry

    executor = WorkflowExecutor(AgentRegistry(gemini))
    context = AgentContext(
        objective="Analyze my resume",
        documents=[StoredDocument("1", "resume.pdf", "application/pdf", "Python, PyTorch")],
    )
    results = {}
    async for result in executor.execute(workflow, context):
        if result.status is not NodeStatus.RUNNING:
            results[result.node_id] = result

    assert all(r.status is NodeStatus.COMPLETED for r in results.values())
    assert pick_answer(workflow, results)


def test_parse_json_handles_fenced_output():
    assert parse_json("```json\n{\"a\": 1}\n```") == {"a": 1}
    assert parse_json(json.dumps({"b": 2})) == {"b": 2}
