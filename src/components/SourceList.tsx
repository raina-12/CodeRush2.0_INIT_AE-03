import type { SourceDTO } from "@/types/agentflow";

export function SourceList({ sources }: { sources: SourceDTO[] }) {
  if (sources.length === 0) return null;
  return (
    <ol className="space-y-2">
      {sources.map((source, index) => (
        <li key={source.url} className="rounded-lg border border-border bg-surface-raised p-3">
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline"
          >
            <span className="mr-2 font-mono text-xs text-muted-foreground">[{index + 1}]</span>
            {source.title || source.url}
          </a>
          <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
            {source.url}
          </p>
          {source.snippet && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{source.snippet}</p>
          )}
        </li>
      ))}
    </ol>
  );
}
