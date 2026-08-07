# Architecture

## Stages

1. **Task Understanding** (`orchestration/understanding.py`) — Gemini interprets the
   objective into intent, deliverables, constraints and whether documents / web
   research are required.
2. **Task Planning + Capability Selection** (`orchestration/planner.py`) — decomposes
   the objective into 2–7 subtasks, each bound to exactly one of the four reusable
   capabilities, with `depends_on` forming a DAG. Independent research angles become
   parallel branches.
3. **Workflow Generation** (`orchestration/generator.py`) — plan → nodes + edges,
   plus topological levelling for parallel execution.
4. **Workflow Examination** (`orchestration/examiner.py`) — validates and repairs:
   drops dangling dependencies, removes document steps when no file was uploaded,
   detects cycles, derives missing search queries, guarantees exactly one terminal
   verification step.
5. **Execution** (`orchestration/executor.py`) — runs each level with
   `asyncio.gather`; downstream nodes of a failed node are marked `skipped`.
   Emits `pending → running → completed | failed | skipped` per node.
6. **Verification** (`agents/verification_agent.py`) — audits the draft answer for
   completeness, consistency and source support; returns a structured report.
7. **Result** — the last successful analysis output plus verification and deduped
   sources.

The `Orchestrator` (`orchestration/orchestrator.py`) wires the stages and yields
`StreamEvent`s that the API forwards as SSE.

## Services and tools

- `services/gemini_service.py` — the single LLM entry point (model, retries of shape,
  JSON extraction, typed configuration/rate-limit errors). Key from `GEMINI_API_KEY`.
- `services/document_store.py` — in-memory parsed-document store keyed by id.
- `tools/file_parser.py` — PDF (pypdf), DOCX (python-docx), TXT/MD extraction.
- `tools/web_search.py` — DuckDuckGo HTML search + parallel page fetch, HTML→text,
  keyless. Unreachable pages are skipped; a total failure raises `WebResearchError`.

## Error handling

`core/errors.py` defines typed errors with stable codes and HTTP statuses:
`configuration_error`, `llm_unavailable`, `invalid_input`, `document_parse_error`,
`web_research_unavailable`. They surface to the UI as explicit states — the system
never fabricates content or sources when a dependency is unavailable.

## Frontend

`src/services/agentflowClient.ts` (HTTP + SSE), `src/services/useAgentFlowRun.ts`
(run state machine), `src/components/WorkflowCanvas.tsx` (React Flow / `@xyflow/react`,
level-based layout, live node status), `ResultPanel` (answer, verification, sources).
