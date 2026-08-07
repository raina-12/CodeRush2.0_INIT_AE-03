import { useRef, useState } from "react";
import { FileText, Loader2, Paperclip, Play, Square, X } from "lucide-react";

import type { DocumentInfo } from "@/types/agentflow";

const EXAMPLES = [
  "Analyze my resume, identify my strongest skills, suggest suitable AI/ML internship roles, and tell me what I should improve.",
  "Analyze NVIDIA's AI business, major products, competitors, recent developments, and explain why it is relevant for an AI student.",
  "Based on my resume, analyze my suitability for AI/ML opportunities at NVIDIA and tell me what skills I should improve.",
];

export function ObjectiveForm({
  running,
  documents,
  uploading,
  uploadError,
  onUpload,
  onRemoveDocument,
  onRun,
  onCancel,
}: {
  running: boolean;
  documents: DocumentInfo[];
  uploading: boolean;
  uploadError: string | null;
  onUpload: (file: File) => void;
  onRemoveDocument: (id: string) => void;
  onRun: (objective: string) => void;
  onCancel: () => void;
}) {
  const [objective, setObjective] = useState("");
  const [touched, setTouched] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const empty = objective.trim().length < 3;

  return (
    <form
      className="panel p-4"
      onSubmit={(event) => {
        event.preventDefault();
        setTouched(true);
        if (empty || running) return;
        onRun(objective.trim());
      }}
    >
      <label htmlFor="objective" className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        Objective
      </label>
      <textarea
        id="objective"
        value={objective}
        onChange={(event) => setObjective(event.target.value)}
        rows={4}
        placeholder="Describe what you want AgentFlow to do…"
        className="mt-2 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
      />
      {touched && empty && (
        <p className="mt-1 text-xs text-destructive">Please describe an objective first.</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUpload(file);
            event.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-raised px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-border-strong disabled:opacity-60"
        >
          {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Paperclip className="size-3.5" />}
          Attach PDF / DOCX / TXT
        </button>

        <div className="ml-auto flex gap-2">
          {running ? (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-raised px-4 py-2 text-sm font-medium text-foreground"
            >
              <Square className="size-3.5" /> Stop
            </button>
          ) : (
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Play className="size-3.5" /> Run workflow
            </button>
          )}
        </div>
      </div>

      {uploadError && <p className="mt-2 text-xs text-destructive">{uploadError}</p>}

      {documents.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {documents.map((doc) => (
            <li
              key={doc.document_id}
              className="flex items-center gap-2 rounded-lg border border-border bg-surface-raised px-3 py-2 text-xs"
            >
              <FileText className="size-3.5 text-cap-document" />
              <span className="truncate font-medium">{doc.filename}</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {doc.characters.toLocaleString()} chars
              </span>
              <button
                type="button"
                onClick={() => onRemoveDocument(doc.document_id)}
                className="ml-auto text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${doc.filename}`}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 border-t border-border pt-3">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Try an objective
        </p>
        <div className="mt-2 space-y-1.5">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setObjective(example)}
              className="block w-full rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
