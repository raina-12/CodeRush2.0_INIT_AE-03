import { useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { AgentNode, type AgentNodeData } from "@/components/AgentNode";
import type { NodeResultDTO, WorkflowDTO } from "@/types/agentflow";

const nodeTypes = { agent: AgentNode };

function levelsOf(workflow: WorkflowDTO): Map<string, number> {
  const level = new Map<string, number>();
  const remaining = new Map(workflow.nodes.map((n) => [n.id, new Set(n.depends_on)]));
  let depth = 0;
  while (remaining.size > 0 && depth < 50) {
    const ready = [...remaining.entries()]
      .filter(([, deps]) => deps.size === 0)
      .map(([id]) => id);
    if (ready.length === 0) break;
    ready.forEach((id) => {
      level.set(id, depth);
      remaining.delete(id);
    });
    remaining.forEach((deps) => ready.forEach((id) => deps.delete(id)));
    depth += 1;
  }
  workflow.nodes.forEach((n) => {
    if (!level.has(n.id)) level.set(n.id, depth);
  });
  return level;
}

export function WorkflowCanvas({
  workflow,
  results,
}: {
  workflow: WorkflowDTO;
  results: Record<string, NodeResultDTO>;
}) {
  const { nodes, edges } = useMemo(() => {
    const level = levelsOf(workflow);
    const perColumn = new Map<number, number>();

    const flowNodes: Node<AgentNodeData>[] = workflow.nodes.map((node) => {
      const col = level.get(node.id) ?? 0;
      const row = perColumn.get(col) ?? 0;
      perColumn.set(col, row + 1);
      const result = results[node.id];
      return {
        id: node.id,
        type: "agent",
        position: { x: col * 320, y: row * 180 },
        data: {
          label: node.label,
          capability: node.capability,
          description: node.description,
          status: result?.status ?? node.status,
          summary: result?.summary ?? "",
          error: result?.error ?? null,
          durationMs: result?.duration_ms ?? 0,
          sourceCount: result?.sources?.length ?? 0,
        },
      };
    });

    const flowEdges: Edge[] = workflow.edges.map((edge) => {
      const status = results[edge.target]?.status ?? "pending";
      const active = status === "running";
      const done = results[edge.source]?.status === "completed";
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: active,
        style: {
          stroke: done ? "var(--color-success)" : "var(--color-border-strong)",
          strokeWidth: 2,
        },
      };
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [workflow, results]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="var(--color-border)" />
        <Controls
          showInteractive={false}
          className="!rounded-lg !border !border-border !bg-surface [&_button]:!border-border [&_button]:!bg-surface [&_button]:!fill-foreground"
        />
      </ReactFlow>
    </div>
  );
}
