import type {
  DocumentInfo,
  HealthResponse,
  StreamEvent,
} from "@/types/agentflow";

export const API_BASE_URL: string =
  (import.meta.env["VITE_AGENTFLOW_API_URL"] as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:8000";

export class ApiError extends Error {
  code: string;
  constructor(message: string, code = "request_failed") {
    super(message);
    this.code = code;
  }
}

async function readError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as {
      detail?: { code?: string; message?: string } | string;
      code?: string;
      message?: string;
    };
    const detail = typeof body.detail === "object" && body.detail ? body.detail : body;
    return new ApiError(
      detail.message ?? `Request failed (${response.status})`,
      detail.code ?? "request_failed",
    );
  } catch {
    return new ApiError(`Request failed (${response.status})`, "request_failed");
  }
}

export async function getHealth(signal?: AbortSignal | null): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/health`, { signal: signal ?? null });
  if (!response.ok) throw await readError(response);
  return (await response.json()) as HealthResponse;
}

export async function uploadDocument(file: File): Promise<DocumentInfo> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`${API_BASE_URL}/api/v1/documents`, {
    method: "POST",
    body: form,
  });
  if (!response.ok) throw await readError(response);
  return (await response.json()) as DocumentInfo;
}

/** POST /api/v1/runs/stream and yield each server-sent event as it arrives. */
export async function* streamRun(
  objective: string,
  documentIds: string[],
  signal?: AbortSignal | null,
): AsyncGenerator<StreamEvent> {
  const response = await fetch(`${API_BASE_URL}/api/v1/runs/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ objective, document_ids: documentIds }),
    signal: signal ?? null,
  });
  if (!response.ok) throw await readError(response);
  if (!response.body) throw new ApiError("The backend returned an empty stream.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const chunk = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const line = chunk
        .split("\n")
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.slice(5).trim())
        .join("");
      if (line) {
        try {
          yield JSON.parse(line) as StreamEvent;
        } catch {
          // ignore malformed keep-alive fragments
        }
      }
      boundary = buffer.indexOf("\n\n");
    }
  }
}
