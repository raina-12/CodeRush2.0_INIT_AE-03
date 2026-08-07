export type Capability = "document" | "web_research" | "analysis" | "verification";

export type NodeStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export interface TaskUnderstanding {
  objective: string;
  intent: string;
  domain: string;
  deliverables: string[];
  constraints: string[];
  needs_document: boolean;
  needs_web_research: boolean;
  clarifications: string[];
}

export interface WorkflowNodeDTO {
  id: string;
  label: string;
  capability: Capability;
  description: string;
  depends_on: string[];
  parameters: Record<string, unknown>;
  status: NodeStatus;
}

export interface WorkflowEdgeDTO {
  id: string;
  source: string;
  target: string;
}

export interface WorkflowDTO {
  id: string;
  run_id?: string;
  objective: string;
  nodes: WorkflowNodeDTO[];
  edges: WorkflowEdgeDTO[];
  understanding: TaskUnderstanding;
  rationale: string;
}

export interface ExaminationIssue {
  severity: "error" | "warning";
  message: string;
  node_id: string | null;
}

export interface ExaminationReport {
  valid: boolean;
  issues: ExaminationIssue[];
  repaired: boolean;
  notes: string[];
}

export interface SourceDTO {
  title: string;
  url: string;
  snippet: string;
}

export interface NodeResultDTO {
  node_id: string;
  capability: Capability;
  status: NodeStatus;
  output: string;
  summary: string;
  sources: SourceDTO[];
  error: string | null;
  duration_ms: number;
}

export interface VerificationReport {
  verdict: "supported" | "partially_supported" | "unsupported";
  completeness: number;
  consistency: number;
  source_support: number;
  unsupported_claims: string[];
  gaps: string[];
  notes: string;
}

export interface FinalResult {
  run_id: string;
  objective: string;
  answer: string;
  verification: VerificationReport | null;
  sources: SourceDTO[];
  node_results: NodeResultDTO[];
}

export interface DocumentInfo {
  document_id: string;
  filename: string;
  content_type: string;
  characters: number;
  preview: string;
}

export interface HealthResponse {
  status: string;
  gemini_configured: boolean;
  model: string;
  capabilities: string[];
}

export type StreamEvent =
  | { type: "understanding"; data: TaskUnderstanding }
  | { type: "plan"; data: Record<string, unknown> }
  | { type: "workflow"; data: WorkflowDTO }
  | { type: "examination"; data: ExaminationReport }
  | { type: "node_update"; data: NodeResultDTO }
  | { type: "final"; data: FinalResult }
  | { type: "error"; data: { code: string; message: string } }
  | { type: "done"; data: Record<string, never> };

export const CAPABILITY_META: Record<
  Capability,
  { label: string; short: string; hint: string }
> = {
  document: {
    label: "Document Agent",
    short: "DOC",
    hint: "Reads uploaded PDF/DOCX/TXT files",
  },
  web_research: {
    label: "Web Research Agent",
    short: "WEB",
    hint: "Retrieves public web sources with URLs",
  },
  analysis: {
    label: "Analysis Agent",
    short: "ANL",
    hint: "Reasoning, comparison and synthesis",
  },
  verification: {
    label: "Verification Agent",
    short: "VER",
    hint: "Completeness, consistency, source support",
  },
};
