"""The orchestrator wires all stages together and emits a stream of events.

User Input -> Task Understanding -> Task Planning -> Capability Selection ->
Workflow Generation -> Workflow Examination -> Execution -> Verification -> Result.
"""

from __future__ import annotations

import json
import uuid
from collections.abc import AsyncIterator

from app.agents.base import AgentContext
from app.agents.registry import AgentRegistry
from app.core.errors import AgentFlowError, ConfigurationError
from app.core.logging import get_logger
from app.db import repository  # <-- IMPORTED DB REPOSITORY
from app.orchestration.examiner import examine
from app.orchestration.executor import WorkflowExecutor, pick_answer
from app.orchestration.generator import generate_workflow
from app.orchestration.planner import PlannerStage
from app.orchestration.understanding import TaskUnderstandingStage
from app.schemas.workflow import (
    Capability,
    NodeResult,
    NodeStatus,
    Source,
    StreamEvent,
    VerificationReport,
)
from app.services.document_store import StoredDocument
from app.services.gemini_service import GeminiService, get_gemini_service

logger = get_logger(__name__)


class Orchestrator:
    def __init__(self, gemini: GeminiService | None = None) -> None:
        self.gemini = gemini or get_gemini_service()
        self.registry = AgentRegistry(self.gemini)
        self.understanding_stage = TaskUnderstandingStage(self.gemini)
        self.planner = PlannerStage(self.gemini)
        self.executor = WorkflowExecutor(self.registry)

    async def run(
        self, objective: str, documents: list[StoredDocument]
    ) -> AsyncIterator[StreamEvent]:
        run_id = str(uuid.uuid4())
        
        # 1. Initialize the run in MongoDB
        await repository.create_run(run_id, objective)
        
        try:
            if not self.gemini.configured:
                raise ConfigurationError(
                    "GEMINI_API_KEY is not configured on the backend. Set it in "
                    "backend/.env and restart the server."
                )

            names = [d.filename for d in documents]

            understanding = await self.understanding_stage.run(objective, names)
            yield StreamEvent(
                type="understanding", data=json.loads(understanding.model_dump_json())
            )

            plan = await self.planner.run(understanding, names)
            yield StreamEvent(type="plan", data=json.loads(plan.model_dump_json()))

            workflow = generate_workflow(plan)
            report = examine(workflow, has_documents=bool(documents))
            
            # 2. Save the planned workflow to MongoDB
            await repository.update_run_plan(
                run_id=run_id,
                understanding=json.loads(understanding.model_dump_json()),
                workflow=json.loads(workflow.model_dump_json())
            )
            
            yield StreamEvent(
                type="workflow",
                data={"run_id": run_id, **json.loads(workflow.model_dump_json())},
            )
            yield StreamEvent(
                type="examination", data=json.loads(report.model_dump_json())
            )
            if not report.valid:
                raise AgentFlowError(
                    "The generated workflow did not pass examination: "
                    + "; ".join(i.message for i in report.issues)
                )

            context = AgentContext(objective=objective, documents=documents)
            results: dict[str, NodeResult] = {}

            async for result in self.executor.execute(workflow, context):
                results[result.node_id] = (
                    result if result.status is not NodeStatus.RUNNING else results.get(result.node_id, result)
                )
                
                # 3. Stream completed intermediate steps to MongoDB
                if result.status in (NodeStatus.COMPLETED, NodeStatus.FAILED, NodeStatus.SKIPPED):
                    await repository.append_node_result(
                        run_id=run_id, 
                        node_result=json.loads(result.model_dump_json())
                    )

                yield StreamEvent(
                    type="node_update", data=json.loads(result.model_dump_json())
                )

            answer = pick_answer(workflow, results)
            verification = _verification_report(workflow, context)
            sources = _dedupe_sources(results)

            if not answer:
                errors = [r.error for r in results.values() if r.error]
                raise AgentFlowError(
                    "No step produced a usable result. " + (" ".join(filter(None, errors)))
                )

            final_data = {
                "run_id": run_id,
                "objective": objective,
                "answer": answer,
                "verification": json.loads(verification.model_dump_json())
                if verification
                else None,
                "sources": [json.loads(s.model_dump_json()) for s in sources],
                "node_results": [
                    json.loads(r.model_dump_json()) for r in results.values()
                ],
            }

            # 4. Save Final Answer and mark as Completed
            await repository.complete_run(run_id=run_id, final_result=final_data)

            yield StreamEvent(
                type="final",
                data=final_data,
            )
            
        except AgentFlowError as exc:
            logger.warning("Run failed: %s", exc.message)
            # 5a. Save Handled Error State
            await repository.fail_run(run_id, exc.message)
            yield StreamEvent(type="error", data={"code": exc.code, "message": exc.message})
            
        except Exception as exc:  # noqa: BLE001
            logger.exception("Run crashed")
            # 5b. Save Unhandled Crash State
            await repository.fail_run(run_id, f"Unexpected error: {exc}")
            yield StreamEvent(
                type="error",
                data={"code": "internal_error", "message": f"Unexpected error: {exc}"},
            )


def _verification_report(workflow, context: AgentContext) -> VerificationReport | None:
    for node in workflow.nodes:
        if node.capability is Capability.VERIFICATION:
            output = context.outputs.get(node.id)
            if output and output.data.get("verification"):
                return VerificationReport(**output.data["verification"])
    return None


def _dedupe_sources(results: dict[str, NodeResult]) -> list[Source]:
    seen: set[str] = set()
    out: list[Source] = []
    for result in results.values():
        for source in result.sources:
            if source.url not in seen:
                seen.add(source.url)
                out.append(source)
    return out  