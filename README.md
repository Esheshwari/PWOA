# PWOA - AI Work Management & Task Prioritization Platform

PWOA (Powerful Workflow Optimization Assistant) is an enterprise-grade full-stack work management platform combining **multi-signal deterministic priority scoring**, **Directed Acyclic Graph (DAG) task dependency resolution**, and **server-side Gemini 3.8 Flash AI reasoning**.

---

## 1. System Architecture

```
                       ┌──────────────────────────────────────────────┐
                       │            Frontend (React 19 + Vite)        │
                       │  • Kanban / List / Eisenhower Matrix Views   │
                       │  • Visual Dependency Graph & Cycle Guard     │
                       │  • Interactive AI Work Assistant Chat        │
                       │  • Empirical AI Evaluation Benchmark Suite   │
                       └──────────────────────┬───────────────────────┘
                                              │ HTTP / JSON REST APIs
                                              ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               Express.js / Node.js Backend                             │
│  ┌────────────────────┐   ┌─────────────────────────┐   ┌───────────────────────────┐  │
│  │   Auth Middleware  │   │  Deterministic Priority │   │   Gemini 3.8 Flash Engine │  │
│  │  • JWT Validation  │   │  • Deadline Urgency     │   │  • Structured JSON Output │  │
│  │  • Bcrypt Hashing  │   │  • Task Criticality     │   │  • Context-grounded chat  │  │
│  │  • Tenant Isolation│   │  • Dependency Impact    │   │  • Automated Evaluation   │  │
│  └────────────────────┘   │  • Effort Efficiency    │   └───────────────────────────┘  │
│                           └─────────────────────────┘                                  │
└─────────────────────────────────────────────┬──────────────────────────────────────────┘
                                              │ SQL
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │           PostgreSQL Relational DB           │
                       │  • users                                     │
                       │  • projects                                  │
                       │  • tasks                                     │
                       │  • task_dependencies (Foreign Keys & Inds)   │
                       │  • task_priority_results (Audit trail)       │
                       │  • ai_evaluations (Benchmark telemetry)      │
                       └──────────────────────────────────────────────┘
```

---

## 2. Deterministic AI Priority Engine

Rather than delegating priority decisions to uncontrolled LLM hallucination, PWOA runs a **two-stage hybrid pipeline**:

### Stage 1: Deterministic Multi-Signal Scoring

The score ($S \in [0, 100]$) is computed through normalized weighting:

$$\text{Priority Score} = w_d \cdot U_{\text{deadline}} + w_i \cdot I_{\text{task}} + w_{dep} \cdot D_{\text{impact}} + w_e \cdot E_{\text{effort}} + w_p \cdot P_{\text{project}}$$

- **Deadline Urgency ($U_{\text{deadline}}$)**:
  - Overdue: `100` (Flags critical risk)
  - Due $< 24$h: `90 – 100`
  - Due $24 – 72$h: `70 – 90`
  - Due $4 – 7$ days: `45 – 70`
  - Due $> 7$ days or none: `15 – 25`
- **Task Criticality ($I_{\text{task}}$)**: `CRITICAL=100`, `HIGH=75`, `MEDIUM=50`, `LOW=25`
- **Dependency Impact ($D_{\text{impact}}$)**: Evaluates downstream deliverables waiting on this task:
  - Blocks $\ge 3$ tasks: `100`
  - Blocks $2$ tasks: `80`
  - Blocks $1$ task: `55`
  - Blocks $0$ tasks: `15`
- **Effort Efficiency ($E_{\text{effort}}$)**: High-impact quick wins are boosted:
  - $\le 60$ minutes: `95`
  - $\le 120$ minutes: `80`
  - $\le 240$ minutes: `60`
  - $> 480$ minutes: `25`
- **Project Importance ($P_{\text{project}}$)**: Strategic initiative weighting.

*Note: Default weights ($w_d=0.35, w_i=0.25, w_{dep}=0.20, w_e=0.10, w_p=0.10$) are configurable via user settings.*

### Stage 2: Gemini 3.8 Flash Contextual Reasoning

The deterministic signals, dependency status, and task description are dispatched to Gemini 3.8 Flash with `responseMimeType: 'application/json'`. The AI generates:
- Strict JSON: `priority_label`, `reasoning`, `deadline_risk`, `recommended_action`, `key_factors`.
- Schema validation ensures zero application crashes in case of malformed output.
- Final priority score synthesizes deterministic math ($80\%$) with LLM alignment ($20\%$).

---

## 3. Dependency Graph & Cycle Guard

Task dependencies are enforced as a Directed Acyclic Graph (DAG):
1. **Self-Dependency Rejection**: `task_id != depends_on_task_id`.
2. **Duplicate Edge Prevention**: Composite primary keys `(task_id, depends_on_task_id)`.
3. **Cycle Guard**: Breadth-First Search (BFS) graph traversal checks whether adding an edge `A -> B` would create a cycle ($B \leadsto A$). Loops are rejected with `400 Bad Request`.

---

## 4. REST API Reference

### Authentication
- `POST /api/auth/register` — Create user account with auto-provisioned workspace.
- `POST /api/auth/login` — Authenticate and receive signed JWT.
- `GET /api/auth/me` — Retrieve active profile and engine weights.
- `PUT /api/auth/weights` — Save custom priority engine weights.

### Projects
- `GET /api/projects` — List user projects with aggregate metrics.
- `POST /api/projects` — Create project.
- `GET /api/projects/:id` — Get project details.
- `PUT /api/projects/:id` — Update project attributes.
- `DELETE /api/projects/:id` — Cascade-delete project and tasks.

### Tasks & Prioritization
- `GET /api/tasks` — List tasks with filtering (project, status, importance, category, search, sorting).
- `POST /api/tasks` — Create task and run immediate prioritization.
- `GET /api/tasks/:id` — Deep task details with signals and dependencies.
- `PUT /api/tasks/:id` — Update task and recalculate priority.
- `DELETE /api/tasks/:id` — Delete deliverable.
- `POST /api/tasks/:id/prioritize` — Rerun deterministic + AI prioritization on a task.
- `POST /api/tasks/prioritize-all` — Batch prioritize all tasks or project deliverables.
- `POST /api/tasks/:id/dependencies` — Add prerequisite with cycle check.
- `DELETE /api/tasks/:id/dependencies/:dependsOnId` — Remove prerequisite.

### AI Assistant & Evaluations
- `POST /api/ai/chat` — Grounded AI assistant with live tasks and project context.
- `POST /api/evaluations/run` — Run empirical AI benchmark test suite.
- `GET /api/evaluations/latest` — Retrieve benchmark historical telemetry.

### Analytics
- `GET /api/analytics` — Real-time telemetry, completion rate, status distribution, and bottlenecks.

---

## 5. Automated AI Evaluation Suite

Located in `/evaluations` and `server/src/services/evaluationService.ts`, the benchmark runner executes 6 ground-truth test cases against the engine:
- **Schema Compliance Rate**: Validates 100% adherence to required JSON schema.
- **Priority Classification Accuracy**: Evaluates classification alignment against expected criticality thresholds.
- **Deadline Risk F1**: Measures sensitivity to overdue and urgent milestones.
- **Average Latency**: Measures execution speed in milliseconds.

---

## 6. Local Development & Deployment

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Set GEMINI_API_KEY in .env

# 3. Start development server (Express + Vite on port 3000)
npm run dev
```

### Pre-Seeded Demo User
- **Email:** `demo@pwoa.dev`
- **Password:** `password123`
- Pre-populated with 3 projects, 16 realistic tasks across various stages, and 4 dependencies.

### LICENSE
MIT LICENSE

### Deployment
pwoa.vercel.app

### Author

Esheshwari Kumari
