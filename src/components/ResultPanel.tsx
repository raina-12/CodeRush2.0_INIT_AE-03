import { useState } from "react";
import Markdown from "react-markdown";
import { AlertTriangle, ShieldCheck, AlignLeft, FileText, ChevronDown, ChevronRight } from "lucide-react";

import { SourceList } from "@/components/SourceList";
import type { FinalResult } from "@/types/agentflow";

const VERDICT_TONE = {
  supported: "text-success border-success/40",
  partially_supported: "text-warning border-warning/40",
  unsupported: "text-destructive border-destructive/40",
} as const;

export function ResultPanel({ result }: { result: FinalResult }) {
  const [viewMode, setViewMode] = useState<"full" | "summary">("full");
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  
  const v = result.verification;

  // Grab the summarizer output from the backend DAG
  const summarizerNode = result.node_results?.find(n => n.capability === "summarize");
  
  const displayContent = viewMode === "summary" 
    ? (summarizerNode?.output || "Summary generation is still running or was skipped...") 
    : result.answer;

  return (
    <div className="space-y-4">
      <article className="panel p-5 relative">
        <div className="mb-3 flex items-center justify-between border-b pb-3">
          <h2 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Final result {viewMode === "summary" ? "(Executive Summary)" : ""}
          </h2>
          
          <button
            onClick={() => setViewMode(viewMode === "full" ? "summary" : "full")}
            className="flex items-center gap-1.5 rounded-md bg-surface-raised px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted border shadow-sm"
          >
            {viewMode === "full" ? (
              <><AlignLeft className="size-3.5" /> View Summary</>
            ) : (
              <><FileText className="size-3.5" /> View Full Report</>
            )}
          </button>
        </div>

        <div className="prose-agentflow mt-3 space-y-3 text-sm leading-relaxed text-foreground [&_a]:text-primary [&_a]:underline [&_code]:font-mono [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_strong]:text-foreground">
          <Markdown>{displayContent}</Markdown>
        </div>
      </article>

      {/* Only show Verification and Sources when in Full Report mode */}
      {viewMode === "full" && (
        <>
          {v && (
            <section className={`panel border p-4 ${VERDICT_TONE[v.verdict]}`}>
              <div className="flex items-center gap-2">
                {v.verdict === "supported" ? (
                  <ShieldCheck className="size-4" />
                ) : (
                  <AlertTriangle className="size-4" />
                )}
                <h3 className="font-mono text-[11px] uppercase tracking-widest">
                  Verification · {v.verdict.replace("_", " ")}
                </h3>
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-3 text-center">
                {[
                  ["Completeness", v.completeness],
                  ["Consistency", v.consistency],
                  ["Source support", v.source_support],
                ].map(([label, value]) => (
                  <div key={label as string} className="rounded-lg bg-surface-raised p-2">
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="mt-1 text-lg font-semibold text-foreground">{value}%</dd>
                  </div>
                ))}
              </dl>
              {v.unsupported_claims.length > 0 && (
                <p className="mt-3 text-xs text-foreground">
                  <span className="font-semibold">Unsupported claims: </span>
                  {v.unsupported_claims.join("; ")}
                </p>
              )}
              {v.gaps.length > 0 && (
                <p className="mt-2 text-xs text-foreground">
                  <span className="font-semibold">Gaps: </span>
                  {v.gaps.join("; ")}
                </p>
              )}
              {v.notes && <p className="mt-2 text-xs text-muted-foreground">{v.notes}</p>}
            </section>
          )}

          {/* Collapsible Sources Dropdown */}
          {result.sources.length > 0 && (
            <section className="panel border overflow-hidden">
              <button 
                onClick={() => setIsSourcesOpen(!isSourcesOpen)}
                className="flex w-full items-center justify-between bg-surface-raised p-4 transition-colors hover:bg-muted/50"
              >
                <h3 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  Sources ({result.sources.length})
                </h3>
                {isSourcesOpen ? (
                  <ChevronDown className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 text-muted-foreground" />
                )}
              </button>
              
              {isSourcesOpen && (
                <div className="border-t p-4">
                  <SourceList sources={result.sources} />
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}