# AgentFlow

Dynamic agentic workflow system. You give a natural-language objective; AgentFlow
understands the task, plans subtasks, selects reusable capabilities, generates a
workflow graph, examines it, executes it live, verifies the result and returns it.

```
User Input → Task Understanding → Task Planning → Capability Selection →
Workflow Generation → Workflow Examination → Execution → Verification → Final Result
```

Workflows are **not** hardcoded: the same four reusable agents are selected per
request, so different objectives produce different graphs.

## Capabilities

| id | Agent | Role |
| --- | --- | --- |
| `document` | Document Agent | Reads uploaded PDF / DOCX / TXT files |
| `web_research` | Web Research Agent | Retrieves public web content and preserves source URLs |
| `analysis` | Analysis Agent | Reasoning, comparison, summarization, synthesis |
| `verification` | Verification Agent | Completeness, consistency and source support |

## Layout

```
backend/app/{api,core,schemas,orchestration,agents,tools,services}   FastAPI + Gemini
backend/tests                                                        offline pipeline tests
src/{components,routes,services,types}                               React + TypeScript frontend
docs/{architecture,api-contracts,demo-flows}.md
```

The frontend lives in this repo's Vite root (`src/`) with the prescribed
`components / services / types` split; `src/routes/index.tsx` is the app page.

## Run the backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env      # then set GEMINI_API_KEY
uvicorn app.main:app --reload --port 8000
```

Get a Gemini key at https://aistudio.google.com/apikey. The key is read from the
`GEMINI_API_KEY` environment variable only — never hardcoded.

Tests: `cd backend && pytest` (fully offline, stubbed LLM).

## Run the frontend

```bash
echo "VITE_AGENTFLOW_API_URL=http://localhost:8000" > .env
bun install && bun run dev
```

If the backend is unreachable or the key is missing, the UI shows an explicit
configuration/error state instead of fabricating a result.

## Demos

See `docs/demo-flows.md` for the three demo objectives and the workflow shapes
they produce.
