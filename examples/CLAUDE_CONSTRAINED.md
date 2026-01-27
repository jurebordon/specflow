# Analytics Dashboard PoC

> This file provides context for AI assistants working on this project.

## Project Overview

React-based dashboard for visualizing sales data, integrating with client's existing Azure infrastructure and .NET Core API. This is a client PoC with strict technology constraints and process requirements.

## Quick Context

- **Type**: Constrained (mandated tech, client PoC)
- **Stack**: React 18, TypeScript, TailwindCSS, Azure AD B2C (MSAL.js)
- **Git Workflow**: CI/CD Gated (Azure DevOps pipeline)

## Constraints (MUST FOLLOW)

### Mandated Technologies
- React 18+ with TypeScript (strict mode)
- Azure AD B2C for authentication (MSAL.js)
- Azure hosting only (Static Web Apps → AKS)
- MIT/Apache licensed dependencies only

### Forbidden Technologies
- AWS services (any) — contractual prohibition
- GCP services (any) — not approved vendor
- GPL-licensed libraries — legal requirement
- Direct database access — must use client API only

### Process Requirements
- PRs require client team approval (minimum 1)
- Deploy via Azure DevOps pipeline only
- Maintain 70% test coverage
- All PII must be EU-resident

## Documentation

Read these before making changes:

| Priority | Document | Purpose |
|----------|----------|---------|
| 1 | [ROADMAP.md](docs_specflow/ROADMAP.md) | Current tasks and priorities |
| 2 | [SESSION_LOG.md](docs_specflow/SESSION_LOG.md) | Recent session history |
| 3 | [OVERVIEW.md](docs_specflow/OVERVIEW.md) | Component architecture |
| 4 | [ADR.md](docs_specflow/ADR.md) | Technical decisions |
| 5 | [VISION.md](docs_specflow/VISION.md) | Product direction |
| 6 | [LEARNED_PATTERNS.md](docs_specflow/LEARNED_PATTERNS.md) | Discovered patterns and conventions |

> **LEARNED_PATTERNS.md**: Append codebase patterns, anti-patterns, and conventions you discover during sessions. The continuous-learning hook will periodically remind you to capture insights. Check this file at session start to avoid re-discovering known patterns.

## Session Commands

Use these commands to structure your work:

- `/plan-session` - Prepare for implementation
- `/start-session` - Begin coding
- `/end-session` - Wrap up and create PR (no local merge!)
- `/verify` - Validate docs consistency and project health
- `/pivot-session` - Reassess direction

Commands are in `.claude/commands/`.

## Technical Enforcement

### Hooks (`.claude/hooks/`)
Automated behaviors at session lifecycle points:
- **SessionStart**: Auto-loads ROADMAP, SESSION_LOG, and feature SPEC into context
- **PreToolUse**: Blocks edits to frozen docs (VISION.md, SPEC.md requirements)
- **PostToolUse**: Auto-formats code after edits, suggests /compact at high context usage, reminds to capture learned patterns
- **Stop**: Reminds to push unpushed commits
- **SessionEnd**: Saves session state snapshot for continuity

### Rules (`.claude/rules/`)
Always-loaded coding guidelines:
- `coding-style.md` — TypeScript strict mode, React component patterns, TailwindCSS conventions
- `git-workflow.md` — Branch naming (feat/DASH-XXX-description), CI/CD merge flow
- `security.md` — Secret protection, MSAL token handling, EU data residency
- `testing.md` — Jest/React Testing Library, 70% coverage requirement
- `documentation.md` — SpecFlow documentation conventions

### Statusline
Real-time display: context usage %, current feature, TODO progress, git status.

## Agents

Role-specific agents in `.claude/agents/` provide specialized behavior:

| Agent | Role | Model Tier |
|-------|------|------------|
| `base.md` | Shared principles and session ritual | sonnet |
| `qa.md` | Test writing and quality assurance | sonnet |
| `architecture.md` | Architecture review and system design (advisory, read-only) | opus |
| `backend.md` | Backend implementation patterns | sonnet |
| `frontend.md` | Frontend implementation patterns | sonnet |
| `build-error-resolver.md` | Build failures, type errors, dependency issues | sonnet |
| `security-reviewer.md` | Security auditing, OWASP review (advisory, read-only) | opus |
| `refactor-cleaner.md` | Dead code removal, complexity reduction | sonnet |

Advisory agents (architecture, security-reviewer) have read/search access only — they report findings but don't modify code.

## Key Patterns

### Frontend (React 18 + TypeScript)
- See `.claude/agents/frontend.md` for patterns
- Structure: `src/pages/` → `src/components/` → `src/hooks/` → `src/services/`
- MSAL.js auth via `src/services/auth.ts` (never store tokens in localStorage)
- Client API calls via `src/services/api.ts` with automatic token attachment
- TailwindCSS utility classes, no CSS modules

## Invariants

These rules must always hold:

- Only MIT/Apache-2.0 licensed dependencies (check with `npm info <pkg> license`)
- No AWS or GCP service usage — Azure only
- All API calls go through client API — no direct database access
- Authentication via MSAL.js only — no custom auth
- PII must remain EU-resident
- Test coverage must stay at or above 70%

## Git Workflow

- Work on feature branches
- Create PR for review (don't merge directly)
- Use `/end-session` to create PR

## Working Agreements

1. **One task per session** - Don't mix unrelated changes
2. **Update docs** - SESSION_LOG.md after every session, ROADMAP.md when tasks change
3. **Ask when unclear** - Don't invent requirements
4. **No manual metrics** - Automated or nothing

## Getting Started

1. Run `/plan-session` to see current priorities
2. Pick ONE task from ROADMAP.md
3. Run `/start-session` to begin
4. When done, run `/end-session`

---

*This project uses [SpecFlow](https://github.com/jurebordon/specflow) for AI-assisted development.*
