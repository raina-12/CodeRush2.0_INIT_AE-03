import type { Capability, NodeStatus } from "@/types/agentflow";
import { CAPABILITY_META } from "@/types/agentflow";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<NodeStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  running: "bg-primary/15 text-primary",
  completed: "bg-success/15 text-success",
  failed: "bg-destructive/15 text-destructive",
  skipped: "bg-warning/15 text-warning",
};

export function StatusBadge({
  status,
  className,
}: {
  status: NodeStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest",
        STATUS_STYLES[status],
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full bg-current",
          status === "running" && "animate-pulse",
        )}
      />
      {status}
    </span>
  );
}

const CAP_STYLES: Record<Capability, string> = {
  document: "text-cap-document border-cap-document/40 bg-cap-document/10",
  web_research: "text-cap-web border-cap-web/40 bg-cap-web/10",
  analysis: "text-cap-analysis border-cap-analysis/40 bg-cap-analysis/10",
  verification: "text-cap-verification border-cap-verification/40 bg-cap-verification/10",
};

export function CapabilityBadge({
  capability,
  className,
}: {
  capability: Capability;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest",
        CAP_STYLES[capability],
        className,
      )}
      title={CAPABILITY_META[capability].hint}
    >
      {CAPABILITY_META[capability].short}
    </span>
  );
}

export { CAP_STYLES };
