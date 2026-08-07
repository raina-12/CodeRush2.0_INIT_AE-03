# API contracts

Base URL: `http://localhost:8000`, prefix `/api/v1`.

## GET /api/v1/health
```json
{ "status": "ok", "gemini_configured": true, "model": "gemini-2.5-flash",
  "capabilities": ["document", "web_research", "analysis", "verification"] }
```

## GET /api/v1/capabilities
`[{ "capability": "document", "name": "Document Agent", "description": "..." }]`

## POST /api/v1/documents  (multipart/form-data, field `file`)
```json
{ "document_id": "uuid", "filename": "resume.pdf", "content_type": "application/pdf",
  "characters": 4210, "preview": "…" }
```
Errors: `400 document_parse_error` (empty, unsupported, unreadable/scanned, too large).

## POST /api/v1/runs/stream
Request:
```json
{ "objective": "…", "document_ids": ["uuid"] }
```
Response: `text/event-stream`, one JSON object per `data:` line:

| `type` | `data` |
| --- | --- |
| `understanding` | `TaskUnderstanding` |
| `plan` | `TaskPlan` (understanding + subtasks + rationale) |
| `workflow` | `Workflow` — `{ run_id, id, objective, nodes[], edges[], understanding, rationale }` |
| `examination` | `ExaminationReport` — `{ valid, repaired, issues[], notes[] }` |
| `node_update` | `NodeResult` — `{ node_id, capability, status, output, summary, sources[], error, duration_ms }` |
| `final` | `{ run_id, objective, answer, verification, sources[], node_results[] }` |
| `error` | `{ code, message }` |
| `done` | `{}` (stream terminator) |

`status` ∈ `pending | running | completed | failed | skipped`.
`capability` ∈ `document | web_research | analysis | verification`.

`Source` = `{ title, url, snippet }`.

`VerificationReport` = `{ verdict: supported|partially_supported|unsupported,
completeness, consistency, source_support, unsupported_claims[], gaps[], notes }`.

## Error envelope
Non-streaming errors: `{ "code": "…", "message": "…" }` (sometimes nested under
`detail`). Codes: `configuration_error` (503), `llm_unavailable` (502),
`invalid_input` (400), `document_parse_error` (400), `web_research_unavailable` (502).
