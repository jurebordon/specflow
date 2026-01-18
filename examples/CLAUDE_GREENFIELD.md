# TaskFlow API

> Simple task management API for personal projects.

## Project Overview

A self-hosted task management API that lets developers track tasks across projects without the complexity of full project management tools.

## Quick Context

- **Type**: Greenfield (fresh project)
- **Stack**: Python 3.11, FastAPI, PostgreSQL, Docker
- **Git Workflow**: Solo (direct merge to main)

## Documentation

| Priority | Document | Purpose |
|----------|----------|---------|
| 1 | [ROADMAP.md](docs/ROADMAP.md) | Current tasks and priorities |
| 2 | [SESSION_LOG.md](docs/SESSION_LOG.md) | Recent session history |
| 3 | [OVERVIEW.md](docs/OVERVIEW.md) | System architecture |
| 4 | [ADR.md](docs/ADR.md) | Architecture decisions |
| 5 | [VISION.md](docs/VISION.md) | Product direction |

## Session Commands

- `/plan-session` - Prepare for implementation
- `/start-session` - Begin coding
- `/end-session` - Wrap up and merge
- `/pivot-session` - Reassess direction

Commands are in `.claude/commands/`.

## Project Structure

```
taskflow/
├── app/
│   ├── main.py           # FastAPI app entry
│   ├── config.py         # Settings and env vars
│   ├── database.py       # DB connection
│   ├── models/           # SQLAlchemy models
│   ├── routes/           # API endpoints
│   ├── services/         # Business logic
│   └── schemas/          # Pydantic schemas
├── tests/
│   ├── unit/
│   └── integration/
├── docker-compose.yml
├── Dockerfile
└── requirements.txt
```

## Key Patterns

### Backend (FastAPI)
- See `.ai/agents/backend.md` for detailed patterns
- Routes → Services → Repositories pattern
- Pydantic for validation
- SQLAlchemy 2.0 async

### Testing
- pytest with httpx for API tests
- Factory pattern for test data
- Run: `pytest tests/`

## API Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/projects | POST | Create project |
| /api/projects | GET | List projects |
| /api/projects/{id}/tasks | POST | Create task |
| /api/projects/{id}/tasks | GET | List tasks |
| /api/tasks/{id} | PATCH | Update task |
| /api/tasks/{id} | DELETE | Delete task |

## Invariants

These rules must always hold:

- Every task must belong to a project
- Every project must belong to a user
- Task status must be one of: todo, in_progress, done
- API keys must be unique and 64 characters

## Git Workflow

- Work on feature branches: `feat/description`, `fix/description`
- Merge directly to main when tests pass
- Use `./scripts/merge-to-main.sh` for clean merges

```bash
# Start work
git checkout main && git pull
git checkout -b feat/my-feature

# End work
pytest tests/
./scripts/merge-to-main.sh
```

## Working Agreements

1. **One task per session** - Don't mix unrelated changes
2. **Update docs** - SESSION_LOG after every session
3. **Ask when unclear** - Don't invent requirements
4. **Tests required** - New features need tests

## Getting Started

1. Run `/plan-session` to see current priorities
2. Pick ONE task from ROADMAP.md
3. Run `/start-session` to begin
4. When done, run `/end-session`

## Common Commands

```bash
# Start services
docker-compose up -d

# Run tests
pytest tests/

# Run specific test
pytest tests/unit/test_task_service.py -v

# Check logs
docker-compose logs -f api
```

---

*This project uses [SpecFlow](https://github.com/yourname/specflow) for AI-assisted development.*
