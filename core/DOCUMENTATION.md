# Documentation Structure

SpecFlow uses a three-layer documentation system designed for AI-assisted development. Each layer has a different change frequency and purpose.

## The Three Layers

```
┌─────────────────────────────────────────────────────────────┐
│  STRATEGIC (rarely changes)                                  │
│  ├── VISION.md      - Product north star                    │
│  └── ADR.md         - Architecture decisions (append-only)  │
├─────────────────────────────────────────────────────────────┤
│  TACTICAL (per milestone/feature)                            │
│  ├── OVERVIEW.md    - Current system state                  │
│  ├── ROADMAP.md     - Now / Next / Later / Done             │
│  └── WORKFLOW.md    - How to work on this repo              │
├─────────────────────────────────────────────────────────────┤
│  OPERATIONAL (every session)                                 │
│  ├── SESSION_LOG.md - Session journal (newest first)        │
│  ├── .claude/agents/* - Role-specific AI guides               │
│  └── .claude/commands/* - Session commands                  │
└─────────────────────────────────────────────────────────────┘
```

## Layer 1: Strategic Documentation

**Change frequency**: Rarely (product pivots, major architecture changes)

### VISION.md

The product north star. Contains:
- Problem statement
- Solution hypothesis
- Target users
- Success metrics (qualitative, not invented numbers)
- Non-goals (explicit scope boundaries)
- Tech stack summary
- Pivot history (append-only log of direction changes)

**Update when**: Product direction fundamentally changes.

### ADR.md (Architecture Decision Record)

Append-only log of significant decisions. Each entry includes:
- Date and status
- Context (why this decision was needed)
- Decision (what was decided)
- Consequences (what this means for the project)
- Related docs/code

**Update when**: A significant technical decision is made. Never modify existing entries - only append new ones.

## Layer 2: Tactical Documentation

**Change frequency**: Per milestone or significant feature

### OVERVIEW.md

Living description of what the system *is now*:
- Current product scope
- Core user journeys
- Architecture at 10,000 ft (components, data flow)
- External contracts (APIs, events, data schemas)
- Invariants (rules that must always hold)

**Update when**: System shape changes (new components, changed architecture, new integrations).

### ROADMAP.md

Single source of truth for work status:

```markdown
## Now (Current Work)
- [ ] Task currently in progress

## Next (Queued)
1. Next priority item
2. Following item

## Later (Backlog)
- Future ideas
- Nice-to-haves

## Done (Recent)
- [x] Completed task (date)

## Blockers
- Anything blocking progress
```

**Update when**: Tasks complete, priorities change, blockers emerge.

### WORKFLOW.md

How to work on this repository:
- Documentation layer overview
- Session lifecycle (before/during/after)
- Update rules for each doc type
- Git workflow for this project
- Integration notes (CI/CD, ticketing)

**Update when**: Process changes.

## Layer 3: Operational Documentation

**Change frequency**: Every coding session

### SESSION_LOG.md

Append-only journal (newest entries first):

```markdown
## Session: YYYY-MM-DD
**Role**: backend / frontend / qa / architecture
**Task**: Reference to ROADMAP task
**Branch**: feature/branch-name

### Summary
- What was accomplished

### Files Changed
- path/to/file1
- path/to/file2

### Decisions
- Any design decisions made (may warrant ADR)

### Blockers
- Issues encountered

### Next
- What should happen in the next session
```

**Update when**: Every session end.

### .claude/agents/*.md

Role-specific guidance for AI assistants:
- `backend.md` - Backend development patterns
- `frontend.md` - Frontend development patterns
- `qa.md` - Testing and quality patterns
- `architecture.md` - Design and architecture guidance

**Update when**: Patterns or conventions change for that role.

### .claude/commands/*.md

Generated session commands:
- `plan-session.md` - Plan next session
- `start-session.md` - Begin implementation
- `end-session.md` - Wrap up and merge
- `pivot-session.md` - Retrospective and adjustment

**Update when**: Tech stack or git workflow changes (regenerate from templates).

## Frozen Documents

Some documents are intentionally frozen after creation:

- `feature_docs/*/SPEC.md` — Per-feature specification (north star, never edited after creation)

These serve as:
- Historical record of initial intent
- Baseline for measuring drift
- Reference for pivot decisions

## Update Rules Summary

| Document | Who Updates | When | How |
|----------|-------------|------|-----|
| VISION.md | Human | Product pivot | Edit in place |
| ADR.md | Human/AI | Architecture decision | Append only |
| OVERVIEW.md | Human/AI | System shape changes | Edit in place |
| ROADMAP.md | Human/AI | Task changes | Edit in place |
| WORKFLOW.md | Human | Process changes | Edit in place |
| SESSION_LOG.md | AI | Every session end | Prepend entry |
| .claude/agents/* | Human/AI | Pattern changes | Edit in place |
| .claude/commands/* | AI | Regenerate on config change | Overwrite |
| feature_docs/*/SPEC.md | Nobody | Never | Read only |

## Documentation Drift

When code and documentation disagree:

1. **Detect it** - AI should flag inconsistencies
2. **Code is truth** - Assume the code is correct (it's what runs)
3. **Update docs** - Bring documentation in line with reality
4. **Log it** - Note the drift in session log or ADR if significant

Never silently ignore drift. It compounds over time.

## Minimal vs. Full Documentation

Not every project needs every document. Setup adapts based on:

| Project Type | Strategic | Tactical | Operational |
|--------------|-----------|----------|-------------|
| Personal/hobby | Optional | ROADMAP only | SESSION_LOG |
| PoC | VISION + ADR | Full | Full |
| Production | Full | Full | Full |
| Existing (adoption) | Derived from code | Partial | Full |

The setup process asks questions to determine the right level.
