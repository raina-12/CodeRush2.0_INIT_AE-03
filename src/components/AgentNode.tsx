import { Handle, Position, type NodeProps } from "@xyflow/react";
import { CapabilityBadge, StatusBadge } from "@/components/StatusBadge";
import { CAPABILITY_META, type Capability, type NodeStatus } from "@/types/agentflow";
import { cn } from "@/lib/utils";

export interface AgentNodeData extends Record<string, unknown> {
  label: string;
  capability: Capability;
  description: string;
  status: NodeStatus;
  summary: string;
  error: string | null;
  durationMs: number;
  sourceCount: number;
}

const RING: Record<NodeStatus, string> = {
  pending: "border-border",
  running: "border-primary animate-pulse-ring",
  completed: "border-success/60",
  failed: "border-destructive/70",
  skipped: "border-warning/60",
};

export function AgentNode({ data }: NodeProps) {
  const d = data as AgentNodeData;
  return (
    <div
      className={cn(
        "w-64 rounded-xl border-2 bg-surface-raised p-3 text-left shadow-panel transition-colors",
        RING[d.status],
      )}
    >
      <Handle type="target" position={Position.Left} className="!size-2 !bg-border-strong" />
      <div className="flex items-center justify-between gap-2">
        <CapabilityBadge capability={d.capability} />
        <StatusBadge status={d.status} />
      </div>
      <p className="mt-2 text-sm font-semibold leading-snug text-foreground">{d.label}</p>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
        {d.error ?? d.summary ?? d.description ?? CAPABILITY_META[d.capability].hint}
      </p>
      {(d.durationMs > 0 || d.sourceCount > 0) && (
        <div className="mt-2 flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
          {d.durationMs > 0 && <span>{(d.durationMs / 1000).toFixed(1)}s</span>}
          {d.sourceCount > 0 && <span>{d.sourceCount} sources</span>}
        </div>
      )}
      <Handle type="source" position={Position.Right} className="!size-2 !bg-border-strong" />
    </div>
  );
}
