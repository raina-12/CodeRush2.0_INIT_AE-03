# Demo flows

None of these are hardcoded. The planner receives only the objective, the uploaded
file names and the capability catalog, so the graph shape is decided per request.

## Demo 1 — Resume analysis (document only)
> "Analyze my resume, identify my strongest skills, suggest suitable AI/ML internship
> roles, and tell me what I should improve."

Typical graph:
```
[document] Read resume → [analysis] Strengths, roles, improvements → [verification]
```
Understanding sets `needs_document = true`, `needs_web_research = false`, so no
research node is selected. No web sources appear in the result panel.

## Demo 2 — Company research (web only, parallel branches)
> "Analyze NVIDIA's AI business, major products, competitors, recent developments,
> and explain why it is relevant for an AI student."

Typical graph:
```
[web_research] AI business & products ┐
[web_research] Competitors            ├→ [analysis] Synthesis → [verification]
[web_research] Recent developments    ┘
```
Branches run in parallel; every retrieved URL is preserved and cited `[n]` in the
brief and listed under Sources.

## Advanced demo — Document + web (combined)
> "Based on my resume, analyze my suitability for AI/ML opportunities at NVIDIA and
> tell me what skills I should improve."

Typical graph:
```
[document] Extract skills ┐
[web_research] NVIDIA AI roles & requirements ┴→ [analysis] Fit & gap analysis → [verification]
```

## Failure states you can reproduce
- No `GEMINI_API_KEY`: header shows "GEMINI_API_KEY not configured"; a run returns
  `configuration_error` instead of an answer.
- Backend down: header shows "backend offline"; runs fail with a network message.
- Scanned/empty PDF: upload returns `document_parse_error` with guidance.
- Web search unreachable: the research node turns **failed**, downstream nodes are
  **skipped**, and the error is shown — no fabricated sources.
