"""Stage 5 — Workflow Examination: validate and repair the generated graph."""

from __future__ import annotations

from app.schemas.workflow import (
    Capability,
    ExaminationIssue,
    ExaminationReport,
    NodeStatus,
    Workflow,
    WorkflowEdge,
    WorkflowNode,
)


def examine(workflow: Workflow, *, has_documents: bool) -> ExaminationReport:
    issues: list[ExaminationIssue] = []
    notes: list[str] = []
    repaired = False

    ids = {n.id for n in workflow.nodes}

    # Drop dangling dependencies.
    for node in workflow.nodes:
        valid = [d for d in node.depends_on if d in ids and d != node.id]
        if valid != node.depends_on:
            issues.append(
                ExaminationIssue(
                    severity="warning",
                    node_id=node.id,
                    message="Removed dependencies that referenced unknown steps.",
                )
            )
            node.depends_on = valid
            repaired = True

    # Document steps require documents.
    if not has_documents:
        doc_nodes = [n for n in workflow.nodes if n.capability is Capability.DOCUMENT]
        if doc_nodes:
            keep = {n.id for n in workflow.nodes} - {n.id for n in doc_nodes}
            workflow.nodes = [n for n in workflow.nodes if n.id in keep]
            for node in workflow.nodes:
                node.depends_on = [d for d in node.depends_on if d in keep]
            issues.append(
                ExaminationIssue(
                    severity="warning",
                    message="Removed document steps because no file was uploaded.",
                )
            )
            repaired = True

    # Cycle detection.
    if _has_cycle(workflow.nodes):
        issues.append(
            ExaminationIssue(severity="error", message="The generated workflow contains a cycle.")
        )
        return _finalize(workflow, issues, notes, repaired, valid=False)

    if not workflow.nodes:
        issues.append(
            ExaminationIssue(
                severity="error", message="The planner produced no executable steps."
            )
        )
        return _finalize(workflow, issues, notes, repaired, valid=False)

    # Web research nodes must have queries.
    for node in workflow.nodes:
        if node.capability is Capability.WEB_RESEARCH and not node.parameters.get("queries"):
            node.parameters["queries"] = [node.label]
            repaired = True
            issues.append(
                ExaminationIssue(
                    severity="warning",
                    node_id=node.id,
                    message="Derived a search query from the step title.",
                )
            )

    # Exactly one terminal verification step.
    verification = [n for n in workflow.nodes if n.capability is Capability.VERIFICATION]
    if not verification:
        terminals = _terminals(workflow.nodes)
        node = WorkflowNode(
            id="verify",
            label="Verify result",
            capability=Capability.VERIFICATION,
            description="Check completeness, consistency and source support.",
            depends_on=[t.id for t in terminals],
            status=NodeStatus.PENDING,
        )
        workflow.nodes.append(node)
        repaired = True
        notes.append("Added the mandatory verification step.")
    else:
        final = verification[-1]
        others = [n for n in workflow.nodes if n.id != final.id]
        dangling = [n.id for n in others if not _has_dependents(n.id, workflow.nodes)]
        missing = [d for d in dangling if d not in final.depends_on]
        if missing:
            final.depends_on.extend(missing)
            repaired = True
            notes.append("Connected unattached steps to verification.")

    workflow.edges = [
        WorkflowEdge(id=f"{dep}->{n.id}", source=dep, target=n.id)
        for n in workflow.nodes
        for dep in n.depends_on
    ]
    return _finalize(workflow, issues, notes, repaired, valid=True)


def _finalize(
    workflow: Workflow,
    issues: list[ExaminationIssue],
    notes: list[str],
    repaired: bool,
    *,
    valid: bool,
) -> ExaminationReport:
    return ExaminationReport(valid=valid, issues=issues, repaired=repaired, notes=notes)


def _has_dependents(node_id: str, nodes: list[WorkflowNode]) -> bool:
    return any(node_id in n.depends_on for n in nodes)


def _terminals(nodes: list[WorkflowNode]) -> list[WorkflowNode]:
    return [n for n in nodes if not _has_dependents(n.id, nodes)] or nodes[-1:]


def _has_cycle(nodes: list[WorkflowNode]) -> bool:
    deps = {n.id: set(n.depends_on) for n in nodes}
    resolved: set[str] = set()
    while deps:
        ready = {nid for nid, d in deps.items() if not (d - resolved)}
        if not ready:
            return True
        resolved |= ready
        for nid in ready:
            deps.pop(nid)
    return False
