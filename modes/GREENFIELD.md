# Greenfield Mode

> For fresh projects with full flexibility.

## When to Use

- Starting a new project from scratch
- No existing codebase or constraints
- Full control over tech stack decisions
- Personal projects, side projects, new startup ideas

## Entry Point

1. PRD (Product Requirements Document)
2. Tech Spec derived from PRD

## Example: Task Management API

Let's walk through a concrete example - building a simple task management API.

### Step 1: Write PRD_V0

```markdown
# PRD: TaskFlow API

## Problem
Developers need a simple, self-hosted task management API for personal projects
that doesn't require a full project management tool.

## Target Users
- Solo developers managing personal projects
- Small teams wanting a lightweight task backend

## Core Features (MVP)
1. Create, read, update, delete tasks
2. Organize tasks into projects
3. Mark tasks as todo/in-progress/done
4. Simple API key authentication

## Non-Goals
- Real-time collaboration
- Mobile apps
- Complex permissions/roles
- Time tracking

## Success Criteria
- API responds in <100ms for typical operations
- Can handle 1000+ tasks per project without degradation
- Self-hostable with single Docker command
```

### Step 2: Generate TECH_SPEC_V0

Using the prompt from `prompts/SETUP.md`, generate:

```markdown
# Tech Spec: TaskFlow API

## Architecture
Simple monolithic API with PostgreSQL storage.

## Tech Stack
- **Backend**: Python 3.11 + FastAPI
- **Database**: PostgreSQL 15
- **ORM**: SQLAlchemy 2.0
- **Testing**: pytest + httpx
- **Infrastructure**: Docker, single container + db

## Data Model
- User (id, api_key, created_at)
- Project (id, user_id, name, created_at)
- Task (id, project_id, title, description, status, created_at, updated_at)

## API Endpoints
- POST /api/projects - Create project
- GET /api/projects - List projects
- POST /api/projects/{id}/tasks - Create task
- GET /api/projects/{id}/tasks - List tasks
- PATCH /api/tasks/{id} - Update task
- DELETE /api/tasks/{id} - Delete task

## Open Questions
- Should we add due dates in MVP?
- Pagination strategy for large task lists?
```

### Step 3: Initialize SpecFlow

Run the init prompt and answer:
- **Mode**: Greenfield
- **Tech stack**: Python/FastAPI, PostgreSQL
- **Git workflow**: Solo
- **Integrations**: None for now

## Setup Flow

```
┌─────────────────────────────────────────┐
│  1. Write PRD_V0                        │
│     - Problem, users, features          │
│     - Constraints, success metrics      │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  2. Generate TECH_SPEC_V0               │
│     - Use prompts/SETUP.md prompt       │
│     - Architecture, data model, APIs    │
│     - Tech stack choices                │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  3. Initialize SpecFlow                 │
│     - Run prompts/INIT.md               │
│     - Answer discovery questions        │
│     - Review generated files            │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  4. Start first session                 │
│     - Use /plan-session                 │
│     - Pick first task from ROADMAP      │
│     - Begin implementation              │
└─────────────────────────────────────────┘
```

## What Gets Generated

Full documentation suite:

```
project/
├── CLAUDE.md
├── docs/
│   ├── frozen/
│   │   ├── PRD_V0.md
│   │   └── TECH_SPEC_V0.md
│   ├── VISION.md
│   ├── ADR.md
│   ├── OVERVIEW.md
│   ├── ROADMAP.md
│   ├── WORKFLOW.md
│   └── SESSION_LOG.md
├── .claude/
│   └── commands/
│       ├── plan-session.md
│       ├── start-session.md
│       ├── end-session.md
│       └── pivot-session.md
└── .ai/
    ├── templates/
    │   └── agent_base.md
    └── agents/
        ├── backend.md
        ├── frontend.md (if applicable)
        ├── qa.md
        └── architecture.md
```

## Discovery Questions

The setup will ask:

### Project Context
- Project name and short description
- Primary goal/problem being solved
- Target users

### Tech Stack
- Backend language and framework
- Frontend framework (if any)
- Database choice
- Infrastructure/deployment target

### Git Workflow
- Solo developer or team?
- Direct merge or PR review?
- CI/CD pipeline?

### Integrations (optional)
- Ticketing system?
- CI/CD platform?

## Example: Generated ROADMAP.md

After setup, your ROADMAP might look like:

```markdown
# Roadmap

**Last Updated**: 2024-01-15
**Current Phase**: Phase 1 - MVP

## Now (Current Work)
- [ ] Set up project scaffolding (FastAPI, Docker, DB)

## Next (Queued)
1. Implement User model and API key auth
2. Implement Project CRUD endpoints
3. Implement Task CRUD endpoints
4. Add input validation and error handling
5. Write tests for all endpoints
6. Create Docker Compose for local dev

## Later (Backlog)
- Pagination for task lists
- Due dates for tasks
- Task filtering and search
- Rate limiting

## Done (Recent)
- None yet (fresh project)

## Blockers
- None
```

## Example: First Session

### Plan Session Output

```markdown
## Session Plan

**Goal**: Set up project scaffolding (FastAPI, Docker, DB)

**Implementation Steps**:
1. Create project structure (app/, tests/, etc.)
2. Set up FastAPI with basic health endpoint
3. Configure SQLAlchemy with PostgreSQL
4. Create Docker Compose (app + postgres)
5. Verify everything starts correctly

**Files to Create**:
- app/__init__.py
- app/main.py
- app/config.py
- app/database.py
- docker-compose.yml
- Dockerfile
- requirements.txt

**Success Criteria**:
- `docker-compose up` starts both services
- GET /health returns 200
- Database connection works
```

### After First Session

SESSION_LOG.md gets its first entry:

```markdown
## Session: 2024-01-15

**Role**: backend
**Task**: Set up project scaffolding
**Branch**: feat/initial-setup

### Summary
- Created FastAPI app with health endpoint
- Set up SQLAlchemy with async support
- Created Docker Compose configuration
- All services start and communicate correctly

### Files Changed
- app/main.py (new)
- app/config.py (new)
- app/database.py (new)
- docker-compose.yml (new)
- Dockerfile (new)
- requirements.txt (new)

### Decisions
- Using async SQLAlchemy for better performance
- Single Dockerfile with multi-stage build

### Blockers
- None

### Next
- Implement User model and API key authentication
```

## Tips

- Keep PRD focused - 1-2 pages is enough for PoC
- Tech Spec should be realistic, not enterprise overkill
- Start with minimal viable documentation
- You can always add more structure later
- First session should be small and achievable (project setup is perfect)

## Common First Tasks

Good candidates for your first session:

1. **Project scaffolding** - Basic structure, configs, Docker
2. **Database setup** - Models, migrations, connection
3. **Auth foundation** - Basic auth mechanism
4. **First endpoint** - One complete CRUD operation

Avoid starting with:
- The most complex feature
- Multiple features at once
- "Let me just add a few more things"

## Next Steps After Setup

1. Review all generated files
2. Fill in any TODO placeholders
3. Run `/plan-session` to plan first work
4. Create feature branch and start coding
5. After first session, run `/end-session` to establish the rhythm

---

*See [prompts/INIT.md](../prompts/INIT.md) for the initialization prompt.*
