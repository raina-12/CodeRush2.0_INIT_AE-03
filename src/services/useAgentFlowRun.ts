import { useCallback, useRef, useState } from "react";

import { ApiError, streamRun, uploadDocument } from "@/services/agentflowClient";
import type {
  DocumentInfo,
  ExaminationReport,
  FinalResult,
  NodeResultDTO,
  TaskUnderstanding,
  WorkflowDTO,
} from "@/types/agentflow";

export type RunPhase =
  | "idle"
  | "understanding"
  | "planning"
  | "executing"
  | "completed"
  | "failed";

export interface RunState {
  phase: RunPhase;
  understanding: TaskUnderstanding | null;
  workflow: WorkflowDTO | null;
  examination: ExaminationReport | null;
  results: Record<string, NodeResultDTO>;
  final: FinalResult | null;
  error: { code: string; message: string } | null;
}

const INITIAL: RunState = {
  phase: "idle",
  understanding: null,
  workflow: null,
  examination: null,
  results: {},
  final: null,
  error: null,
};

export function useAgentFlowRun() {
  const [state, setState] = useState<RunState>(INITIAL);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const addDocument = useCallback(async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const info = await uploadDocument(file);
      setDocuments((prev) => [...prev, info]);
    } catch (error) {
      setUploadError(
        error instanceof ApiError
          ? error.message
          : "Could not reach the AgentFlow backend to upload this file.",
      );
    } finally {
      setUploading(false);
    }
  }, []);

  const removeDocument = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((d) => d.document_id !== id));
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState((prev) => ({ ...prev, phase: prev.final ? "completed" : "idle" }));
  }, []);

  const start = useCallback(
    async (objective: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setState({ ...INITIAL, phase: "understanding" });

      try {
        for await (const event of streamRun(
          objective,
          documents.map((d) => d.document_id),
          controller.signal,
        )) {
          switch (event.type) {
            case "understanding":
              setState((p) => ({ ...p, understanding: event.data, phase: "planning" }));
              break;
            case "workflow":
              setState((p) => ({ ...p, workflow: event.data }));
              break;
            case "examination":
              setState((p) => ({ ...p, examination: event.data, phase: "executing" }));
              break;
            case "node_update":
              setState((p) => ({
                ...p,
                results: { ...p.results, [event.data.node_id]: event.data },
              }));
              break;
            case "final":
              setState((p) => ({ ...p, final: event.data, phase: "completed" }));
              break;
            case "error":
              setState((p) => ({ ...p, error: event.data, phase: "failed" }));
              break;
            default:
              break;
          }
        }
        setState((p) =>
          p.phase === "failed" || p.final ? p : { ...p, phase: "failed", error: p.error },
        );
      } catch (error) {
        if (controller.signal.aborted) return;
        setState((p) => ({
          ...p,
          phase: "failed",
          error: {
            code: error instanceof ApiError ? error.code : "network_error",
            message:
              error instanceof ApiError
                ? error.message
                : "Could not reach the AgentFlow backend. Start it with `uvicorn app.main:app --port 8000`.",
          },
        }));
      }
    },
    [documents],
  );

  const reset = useCallback(() => setState(INITIAL), []);

  return {
    state,
    documents,
    uploading,
    uploadError,
    addDocument,
    removeDocument,
    start,
    cancel,
    reset,
  };
}
