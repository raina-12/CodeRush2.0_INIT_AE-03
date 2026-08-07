"""Stage 6 — Execution: run the DAG level by level, streaming live node states."""

from __future__ import annotations

import asyncio
import time
from collections.abc import AsyncIterator

from app.agents.base import AgentContext, AgentOutput
from app.agents.registry import AgentRegistry
from app.core.errors import AgentFlowError
from app.core.logging import get_logger
from app.orchestration.generator import topological_levels
from app.schemas.workflow import (
    Capability,
    NodeResult,
    NodeStatus,
    Workflow,
    WorkflowNode,
)

logger = get_logger(__name__)


class WorkflowExecutor:
    def __init__(self, registry: AgentRegistry) -> None:
        self.registry = registry

    async def execute(
        self, workflow: Workflow, context: AgentContext
    ) -> AsyncIterator[NodeResult]:
        failed: set[str] = set()

        for level in topological_levels(workflow):
            runnable: list[WorkflowNode] = []
            for node in level:
                if any(dep in failed for dep in node.depends_on):
                    node.status = NodeStatus.SKIPPED
                    failed.add(node.id)
                    yield NodeResult(
                        node_id=node.id,
                        capability=node.capability,
                        status=NodeStatus.SKIPPED,
                        error="Skipped because an upstream step failed.",
                    )
                else:
                    node.status = NodeStatus.RUNNING
                    runnable.append(node)
                    yield NodeResult(
                        node_id=node.id,
                        capability=node.capability,
                        status=NodeStatus.RUNNING,
                    )

            if not runnable:
                continue

            results = await asyncio.gather(
                *(self._run_node(node, context) for node in runnable)
            )
            for node, result in zip(runnable, results):
                node.status = result.status
                if result.status is NodeStatus.FAILED:
                    failed.add(node.id)
                yield result

    async def _run_node(self, node: WorkflowNode, context: AgentContext) -> NodeResult:
        started = time.perf_counter()
        agent = self.registry.get(node.capability)
        try:
            output: AgentOutput = await agent.run(node, context)
            context.outputs[node.id] = output
            return NodeResult(
                node_id=node.id,
                capability=node.capability,
                status=NodeStatus.COMPLETED,
                output=output.content,
                summary=output.summary,
                sources=output.sources,
                duration_ms=int((time.perf_counter() - started) * 1000),
            )
        except AgentFlowError as exc:
            logger.warning("Node %s failed: %s", node.id, exc.message)
            return self._failure(node, exc.message, started)
        except Exception as exc:  # noqa: BLE001
            logger.exception("Node %s crashed", node.id)
            return self._failure(node, f"Unexpected error: {exc}", started)

    @staticmethod
    def _failure(node: WorkflowNode, message: str, started: float) -> NodeResult:
        return NodeResult(
            node_id=node.id,
            capability=node.capability,
            status=NodeStatus.FAILED,
            error=message,
            duration_ms=int((time.perf_counter() - started) * 1000),
        )


def pick_answer(workflow: Workflow, results: dict[str, NodeResult]) -> str:
    """The final answer is the last successful analysis step (verification audits it)."""
    order = [n.id for n in workflow.nodes]
    analysis = [
        results[nid]
        for nid in order
        if nid in results
        and results[nid].capability is Capability.ANALYSIS
        and results[nid].status is NodeStatus.COMPLETED
    ]
    if analysis:
        return analysis[-1].output
    completed = [
        results[nid]
        for nid in order
        if nid in results
        and results[nid].status is NodeStatus.COMPLETED
        and results[nid].capability is not Capability.VERIFICATION
    ]
    return completed[-1].output if completed else ""
