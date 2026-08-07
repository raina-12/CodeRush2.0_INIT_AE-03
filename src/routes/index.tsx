import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Workflow as WorkflowIcon } from "lucide-react";

import { BackendStatus } from "@/components/BackendStatus";
import { ObjectiveForm } from "@/components/ObjectiveForm";
import { ResultPanel } from "@/components/ResultPanel";
import { WorkflowCanvas } from "@/components/WorkflowCanvas";
import { CapabilityBadge } from "@/components/StatusBadge";
import { useAgentFlowRun } from "@/services/useAgentFlowRun";
import { CAPABILITY_META, type Capability } from "@/types/agentflow";

const TITLE = "AgentFlow — Dynamic Agentic Workflow Engine";
const DESCRIPTION =
  "Give AgentFlow an objective: it understands the task, plans subtasks, selects reusable agents, generates and validates a workflow, executes it live, and verifies the result.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgentFlowPage,
});

const PHASE_LABEL: Record<string, string> = {
  idle: "Idle",
  understanding: "Understanding the task…",
  planning: "Planning subtasks & selecting capabilities…",
  executing: "Executing workflow…",
  completed: "Completed",
  failed: "Failed",
};

function AgentFlowPage() {
  const run = useAgentFlowRun();
  const { state } = run;
  const running = state.phase === "understanding" || state.phase === "planning" || state.phase === "executing";

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1500px] px-5 py-6">
      <header className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <WorkflowIcon className="size-5 text-primary" />
          <h1 className="text-lg font-semibold tracking-tight">AgentFlow</h1>
        </div>
        <p className="hidden text-xs text-muted-foreground md:block">
          understand → plan → select → generate → examine → execute → verify
        </p>
        <div className="ml-auto flex items-center gap-2">
          <BackendStatus />
        </div>
      </header>

      <div className="mt-5 grid gap-5 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <ObjectiveForm
            running={running}
            documents={run.documents}
            uploading={run.uploading}
            uploadError={run.uploadError}
            onUpload={run.addDocument}
            onRemoveDocument={run.removeDocument}
            onRun={run.start}
            onCancel={run.cancel}
          />

          <section className="panel p-4">
            <h2 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Reusable capabilities
            </h2>
            <ul className="mt-3 space-y-2">
              {(Object.keys(CAPABILITY_META) as Capability[]).map((cap) => (
                <li key={cap} className="flex items-start gap-2">
                  <CapabilityBadge capability={cap} />
                  <div>
                    <p className="text-xs font-medium">{CAPABILITY_META[cap].label}</p>
                    <p className="text-[11px] text-muted-foreground">{CAPABILITY_META[cap].hint}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {state.understanding && (
            <section className="panel p-4">
              <h2 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Task understanding
              </h2>
              <p className="mt-2 text-sm">{state.understanding.intent}</p>
              {state.understanding.deliverables.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {state.understanding.deliverables.map((d) => (
                    <li key={d}>• {d}</li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {state.examination && (
            <section className="panel p-4">
              <h2 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Workflow examination
              </h2>
              <p className="mt-2 text-xs">
                {state.examination.valid ? "Graph validated" : "Graph rejected"}
                {state.examination.repaired && " · auto-repaired"}
              </p>
              {[...state.examination.issues.map((i) => i.message), ...state.examination.notes].map(
                (message) => (
                  <p key={message} className="mt-1 text-[11px] text-muted-foreground">
                    – {message}
                  </p>
                ),
              )}
            </section>
          )}
        </div>

        <div className="space-y-4">
          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <h2 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Generated workflow
              </h2>
              <span className="font-mono text-[11px] text-primary">
                {PHASE_LABEL[state.phase]}
              </span>
            </div>
            <div className="h-[460px]">
              {state.workflow ? (
                <ClientOnly fallback={<CanvasPlaceholder text="Rendering workflow…" />}>
                  <WorkflowCanvas workflow={state.workflow} results={state.results} />
                </ClientOnly>
              ) : (
                <CanvasPlaceholder
                  text={
                    running
                      ? "Planning the workflow for your objective…"
                      : "Run an objective — the workflow graph is generated dynamically for each request."
                  }
                />
              )}
            </div>
          </section>

          {state.error && (
            <div className="panel flex items-start gap-3 border border-destructive/40 p-4">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">
                  {state.error.code.replace(/_/g, " ")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{state.error.message}</p>
              </div>
            </div>
          )}

          {state.final && <ResultPanel result={state.final} />}
        </div>
      </div>
    </main>
  );
}

function CanvasPlaceholder({ text }: { text: string }) {
  return (
    <div className="relative flex h-full items-center justify-center">
      <div className="grid-backdrop absolute inset-0" />
      <p className="relative max-w-sm px-6 text-center text-xs text-muted-foreground">{text}</p>
    </div>
  );
}
