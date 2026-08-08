# CodeRush 2.0 | Init Project Repository
## Project Information
* Team Name: Init<br>
* Project Title: Unified Agent Form Orchestrator<br>
* Track/Theme: Agent Ecosystem
## Project Description
### Problem Overview
Managing complex AI workflows using a single prompt or monolithic LLM call often leads to unpredictable outputs, lack of governance, and zero visibility into intermediate steps. To solve multi-step problems reliably, tasks must be broken down across specialized AI roles, but existing tools lack structured execution controls (such as token/cost budgets, explicit tool permissions, and verification gates) and continuous state visibility.
### Proposed Solution: Orqestra Web Application
Orqestra Web Application is a full-stack web application designed to configure, generate, visualize, and execute specialized agent networks: <br> 
LLM Configuration: Allows users to configure commercial models (e.g., Gemini gemini-2.5-flash) or local LLM backends with custom tuning and document/search parameters. <br>Goal-Driven Network Generation: Automatically creates a typed network of specialized AI agents based on a plain-language goal description.<br>
Visual Execution Graph: Uses react to render an interactive node graph, enabling users to visually trace sequential or parallel agent execution in real time. <br> Governance & Controls: Enforces active execution constraints—including visible state updates, resource budget limits, tool/action permissions, and verification loops—to ensure output accuracy and control.
## Technical Stack
Frontend: React, React Flow, TypeScript, TanStack Start, TanStack Router, react, Tailwind CSS, Bun <br> 
Backend: FastAPI, Python, Cython, ReportLab <br> 
Database: In-Memory State & Runtime <br> 
ContextTools/APIs: Google Gemini API (gemini-2.5-flash), Vite, Bun 
## Setup and Installation
1. Clone the repository
```bash
git clone https://github.com/your-username/AgentFlow.git
cd CodeRush2.0_INIT_AE-03
```

2. **Install dependencies**

**Backend:**

```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**

```bash
cd frontend
bun install
```

3. **Configure environment variables**

Copy the example environment file:

```bash
cp .env.example .env
```

Then add the required API keys and configuration values to `.env`.

4. **Start the development servers**

**Backend:**

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

**Frontend:**

Open a new terminal:

```bash
cd frontend
bun run dev
```
