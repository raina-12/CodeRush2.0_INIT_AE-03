import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

import { API_BASE_URL, getHealth } from "@/services/agentflowClient";
import type { HealthResponse } from "@/types/agentflow";

export function BackendStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    getHealth(controller.signal)
      .then((data) => setHealth(data))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Backend unreachable");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <Pill tone="muted">
        <Loader2 className="size-3 animate-spin" /> checking backend
      </Pill>
    );
  }

  if (error || !health) {
    return (
      <Pill tone="destructive" title={`${API_BASE_URL} is not responding`}>
        <AlertTriangle className="size-3" /> backend offline — start FastAPI on{" "}
        {API_BASE_URL}
      </Pill>
    );
  }

  if (!health.gemini_configured) {
    return (
      <Pill tone="warning">
        <AlertTriangle className="size-3" /> GEMINI_API_KEY not configured on backend
      </Pill>
    );
  }

  return (
    <Pill tone="success">
      <CheckCircle2 className="size-3" /> backend ready · {health.model}
    </Pill>
  );
}

function Pill({
  tone,
  children,
  title,
}: {
  tone: "muted" | "success" | "warning" | "destructive";
  children: React.ReactNode;
  title?: string;
}) {
  const tones = {
    muted: "border-border text-muted-foreground",
    success: "border-success/40 text-success",
    warning: "border-warning/40 text-warning",
    destructive: "border-destructive/40 text-destructive",
  } as const;
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full border bg-surface px-3 py-1 font-mono text-[11px] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
