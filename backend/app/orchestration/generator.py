"""Stage 4 — Workflow Generation: turn the plan into an executable DAG."""

from __future__ import annotations

import uuid

from app.schemas.workflow import (
    NodeStatus,
    TaskPlan,
    Workflow,
    WorkflowEdge,
    WorkflowNode,
)


def generate_workflow(plan: TaskPlan) -> Workflow:
    nodes = [
        WorkflowNode(
            id=st.id,
            label=st.title,
            capability=st.capability,
            description=st.description,
            depends_on=list(st.depends_on),
            parameters=dict(st.parameters),
            status=NodeStatus.PENDING,
        )
        for st in plan.subtasks
    ]
    edges = [
        WorkflowEdge(id=f"{dep}->{node.id}", source=dep, target=node.id)
        for node in nodes
        for dep in node.depends_on
    ]
    return Workflow(
        id=str(uuid.uuid4()),
        objective=plan.understanding.objective,
        verbosity=plan.verbosity, # <-- ADD THIS LINE
        nodes=nodes,
        edges=edges,
        understanding=plan.understanding,
        rationale=plan.rationale,
    )


def topological_levels(workflow: Workflow) -> list[list[WorkflowNode]]:
    """Group nodes into levels that can be executed in parallel."""
    remaining = {n.id: set(n.depends_on) for n in workflow.nodes}
    by_id = {n.id: n for n in workflow.nodes}
    levels: list[list[WorkflowNode]] = []

    while remaining:
        ready = [nid for nid, deps in remaining.items() if not deps]
        if not ready:  # cycle — should be caught by the examiner
            break
        levels.append([by_id[nid] for nid in ready])
        for nid in ready:
            remaining.pop(nid)
        for deps in remaining.values():
            deps.difference_update(ready)
    return levels
