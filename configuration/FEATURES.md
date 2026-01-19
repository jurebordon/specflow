# Feature-Scoped Documentation

For large projects where multiple features are developed in parallel, project-level documentation doesn't scale. Feature-scoped documentation provides isolated tracking per feature.

## Important: Features ≠ Worktrees

**Feature documentation** and **git worktrees** are separate concerns:

- **Feature docs** = How documentation is organized (central vs per-feature)
- **Worktrees** = Git workflow for parallel development

You can use:
- Central docs without worktrees (single workspace, unified docs)
- Central docs with worktrees (parallel workspaces, tagged tasks)
- Per-feature docs without worktrees (switch branches, feature-scoped docs)
- Per-feature docs with worktrees (parallel workspaces, feature-scoped docs)

See [WORKTREES.md](WORKTREES.md) for the git workflow aspect.

## When to Use Feature Docs

| Situation | Use Feature Docs? |
|-----------|-------------------|
| Single developer, one task at a time | No - project docs are fine |
| Multi-week feature work | Yes |
| Multiple parallel features | Yes |
| Different people on different features | Yes |
| Quick bug fix or small change | No |
| Major new functionality | Yes |

## Structure

```
project/
├── CLAUDE.md                    # Project context
├── docs/
│   ├── OVERVIEW.md              # Project architecture
│   ├── ADR.md                   # Project-level decisions
│   ├── ROADMAP.md               # High-level project roadmap (optional)
│   └── features/                # Feature-specific documentation
│       ├── feature-one/
│       │   ├── SPEC.md          # Feature specification
│       │   ├── ROADMAP.md       # Feature task tracking
│       │   └── SESSION_LOG.md   # Feature session history
│       ├── feature-two/
│       │   └── ...
│       └── _completed/          # Archived completed features
│           └── old-feature/
```

## Feature Documentation Files

### SPEC.md (Feature Specification)

The **north star** for the feature - what you're building and why.

Contents:
- Feature overview and purpose
- Requirements and acceptance criteria
- Dependencies (upstream and downstream)
- Success criteria
- Open questions
- Decisions made

This file is created at feature start and updated as decisions are made.

### ROADMAP.md (Feature Tasks)

Tracks progress on this specific feature.

Contents:
- Ticket/MR reference
- Branch name
- Now/Next/Later/Done tasks
- Blockers

This file is updated every session.

### SESSION_LOG.md (Feature Sessions)

History of work done on this feature.

Contents:
- Session entries (newest first)
- Files changed per session
- Decisions made
- What's next

This file is appended every session.

## Workflow

### Starting a New Feature

```bash
# Create feature documentation
/new-feature customer-dimension

# This prompts for:
# - Feature description
# - Requirements
# - Ticket/MR reference
# - Branch name

# Creates:
# - docs/features/customer-dimension/SPEC.md
# - docs/features/customer-dimension/ROADMAP.md
# - docs/features/customer-dimension/SESSION_LOG.md
```

### Working on a Feature

```bash
# Plan session for specific feature
/plan-session --feature customer-dimension

# Start session
/start-session --feature customer-dimension

# ... do work ...

# End session
/end-session --feature customer-dimension
```

### Completing a Feature

When all tasks are done:

1. Verify success criteria in SPEC.md
2. Add final SESSION_LOG entry
3. Update project ADR.md if decisions were made
4. Update project OVERVIEW.md if architecture changed
5. Optionally move to `_completed/`:
   ```bash
   mv docs/features/customer-dimension docs/features/_completed/
   ```

## Feature Naming

Use kebab-case for feature names:
- `customer-dimension`
- `order-metrics`
- `auth-refactor`
- `api-v2-migration`

The name becomes the folder name and is referenced in commands.

## Relationship to Project Docs

| Document | Scope | When Updated |
|----------|-------|--------------|
| CLAUDE.md | Project | At project setup |
| docs/OVERVIEW.md | Project | When architecture changes |
| docs/ADR.md | Project | When significant decisions made |
| docs/ROADMAP.md | Project | Optional high-level tracking |
| feature/SPEC.md | Feature | At feature start, when decisions made |
| feature/ROADMAP.md | Feature | Every session |
| feature/SESSION_LOG.md | Feature | Every session |

Feature docs are **self-contained** - all context for working on a feature is in its folder. Project docs provide broader context and capture decisions that affect multiple features.

## Parallel Features

When working on multiple features:

```
docs/features/
├── customer-dimension/    # Alice is working on this
├── order-metrics/         # Bob is working on this
└── auth-refactor/         # Carol is working on this
```

Each developer uses feature-specific commands:
- Alice: `/plan-session --feature customer-dimension`
- Bob: `/plan-session --feature order-metrics`
- Carol: `/plan-session --feature auth-refactor`

No conflicts in documentation - each feature has its own tracking.

## Switching Between Features

If you need to switch features mid-stream:

1. End current session properly:
   ```
   /end-session --feature current-feature
   ```

2. Start new feature session:
   ```
   /plan-session --feature other-feature
   ```

The SESSION_LOG for each feature maintains its own context.

## Example: DBT Project

In a DBT project with multiple data marts being built:

```
docs/features/
├── customer-dimension/
│   ├── SPEC.md          # dim_customer requirements
│   ├── ROADMAP.md       # Model creation tasks
│   └── SESSION_LOG.md   # Session history
├── order-metrics/
│   ├── SPEC.md          # fct_orders requirements
│   ├── ROADMAP.md       # Model creation tasks
│   └── SESSION_LOG.md   # Session history
└── revenue-reporting/
    ├── SPEC.md          # Revenue mart requirements
    ├── ROADMAP.md       # Model creation tasks
    └── SESSION_LOG.md   # Session history
```

Each mart is tracked independently, even if they share upstream dependencies.

## Tips

1. **One feature = one branch** - Keep features isolated in git too
2. **SPEC is your north star** - Refer back to it when scope creeps
3. **Update as you go** - Don't batch documentation updates
4. **Archive completed features** - Keeps active features visible
5. **Project docs for cross-cutting concerns** - ADR for decisions affecting multiple features
