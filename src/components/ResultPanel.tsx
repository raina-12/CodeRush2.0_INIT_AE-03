import Markdown from "react-markdown";
import { AlertTriangle, FileDown, ShieldCheck } from "lucide-react";

import { SourceList } from "@/components/SourceList";
import { downloadResultPdf } from "@/lib/pdf";
import type { FinalResult } from "@/types/agentflow";

const VERDICT_TONE = {
  supported: "text-success border-success/40",
  partially_supported: "text-warning border-warning/40",
  unsupported: "text-destructive border-destructive/40",
} as const;

export function ResultPanel({ result }: { result: FinalResult }) {
  const v = result.verification;
  return (
    <div className="space-y-4">
      <article className="panel p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Final result
          </h2>
          <button
            type="button"
            onClick={() => downloadResultPdf(result)}
            className="neu-sm inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-foreground transition-shadow hover:shadow-neu"
          >
            <FileDown className="size-3.5" /> Download PDF
          </button>
        </div>
        <div className="prose-agentflow mt-3 space-y-3 text-sm leading-relaxed text-foreground [&_a]:text-primary [&_a]:underline [&_code]:font-mono [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_strong]:text-foreground">
          <Markdown>{result.answer}</Markdown>
        </div>
      </article>

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

      {result.sources.length > 0 && (
        <section className="panel p-4">
          <h3 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Sources ({result.sources.length})
          </h3>
          <div className="mt-3">
            <SourceList sources={result.sources} />
          </div>
        </section>
      )}
    </div>
  );
}