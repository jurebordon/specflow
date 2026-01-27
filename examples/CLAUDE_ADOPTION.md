# Analytics Data Warehouse (DBT)

> This file provides context for AI assistants working on this project.

## Project Overview

Existing DBT project (~50 models) providing analytics data marts for business intelligence, built on Snowflake. In production for 1+ year with 3 source systems (Salesforce, Stripe, internal app). Adding SpecFlow structure incrementally.

## Quick Context

- **Type**: Adoption (existing codebase, adding structure)
- **Stack**: DBT 1.7, Snowflake, Python (macros), dbt-utils
- **Git Workflow**: CI/CD Gated (GitLab MR)

## Documentation

Read these before making changes:

| Priority | Document | Purpose |
|----------|----------|---------|
| 1 | [ROADMAP.md](docs_specflow/ROADMAP.md) | Current analytics work |
| 2 | [SESSION_LOG.md](docs_specflow/SESSION_LOG.md) | Recent session history |
| 3 | [OVERVIEW.md](docs_specflow/OVERVIEW.md) | Model inventory and lineage |
| 4 | [ADR.md](docs_specflow/ADR.md) | Data modeling decisions |
| 5 | [VISION.md](docs_specflow/VISION.md) | Data platform direction |
| 6 | [LEARNED_PATTERNS.md](docs_specflow/LEARNED_PATTERNS.md) | Discovered patterns and conventions |

> **LEARNED_PATTERNS.md**: Append codebase patterns, anti-patterns, and conventions you discover during sessions. The continuous-learning hook will periodically remind you to capture insights. Check this file at session start to avoid re-discovering known patterns.

## Session Commands

Use these commands to structure your work:

- `/plan-session` - Prepare for implementation
- `/start-session` - Begin coding
- `/end-session` - Wrap up and create MR (no local merge!)
- `/verify` - Validate docs consistency and project health
- `/pivot-session` - Reassess modeling approach

Commands are in `.claude/commands/`.

## Agents

Role-specific agents in `.claude/agents/` provide specialized behavior:

| Agent | Role | Model Tier |
|-------|------|------------|
| `base.md` | Shared principles and session ritual | sonnet |
| `qa.md` | Test writing and quality assurance | sonnet |
| `architecture.md` | Architecture review and system design (advisory, read-only) | opus |
| `backend.md` | Backend implementation patterns | sonnet |
| `frontend.md` | Frontend implementation patterns | sonnet |

Advisory agents (architecture) have read/search access only — they report findings but don't modify code.

## Key Patterns

### Backend (DBT + Snowflake)
- See `.claude/agents/backend.md` for patterns
- Structure: `models/staging/` → `models/intermediate/` → `models/marts/`
- Naming: `stg_[source]__[table]`, `int_[entity]__[transform]`, `dim_[entity]`, `fct_[event]`
- Surrogate keys via `dbt_utils.generate_surrogate_key()`
- Incremental models for fact tables >1M rows (ADR-001)

## Invariants

These rules must always hold:

- Every new model must have a `schema.yml` entry with description
- Primary keys must have `unique` and `not_null` tests
- Foreign keys must have `relationships` tests
- All timestamps stored in UTC (ADR-002)
- Soft deletes via `_is_deleted` flag — no hard deletes (ADR-003)
- Customer grain is Salesforce Account ID (ADR-004)
- Staging models: no joins, minimal logic, 1:1 with source

## Git Workflow

- Work on feature branches
- Create MR and let CI/CD handle merge
- Do not merge locally

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
