# Development Workflow

> How to work on this repository - for humans and AI assistants.

## Documentation Layers

| Layer | Documents | Change Frequency |
|-------|-----------|------------------|
| **Strategic** | VISION.md, ADR.md | Rarely (pivots, major decisions) |
| **Tactical** | OVERVIEW.md, ROADMAP.md, WORKFLOW.md | Per milestone/feature |
| **Operational** | Session log | Every session |
| **Frozen** | feature_docs/*/SPEC.md | Never (feature north star) |

## Session Lifecycle

### Before Starting Work

- [ ] Read `ROADMAP.md` - pick ONE task from Now/Next
- [ ] Read last 3 entries in `SESSION_LOG.md`
- [ ] Check `ADR.md` for relevant decisions
- [ ] Run `/plan-session` or read the plan prompt

### During Work

- [ ] Create feature branch: the pattern in `Git Workflow > Branch Convention`
- [ ] Stay within scope of chosen task
- [ ] Commit frequently with clear messages
- [ ] Note any decisions made for later documentation

### After Work

- [ ] Run tests: every command under `## Commands` → `### Test`
- [ ] Update `ROADMAP.md` (mark done, adjust Next)
- [ ] Append entry to `SESSION_LOG.md`
- [ ] If architecture changed: update `OVERVIEW.md` and/or `ADR.md`
- [ ] Merge or open a PR per `Git Workflow > Type`

## Git Workflow

### Solo Developer Flow

```
main ←── feature/branch
         └── merge when tests pass
```

- Branch from main: `git checkout -b type/description`
- Work and commit on branch
- When done: `./scripts/merge-to-main.sh` or merge manually
- Branch naming: `feat/`, `fix/`, `refactor/`, `docs/`

### PR Review Flow

```
main ←── PR ←── feature/branch
         └── requires review
```

- Branch from main: `git checkout -b type/description`
- Work and commit on branch
- When done: create PR via `gh pr create` or platform UI
- Do NOT merge locally - wait for review
- Branch naming: `feat/`, `fix/`, `refactor/`, `docs/`

### CI/CD Gated Flow

```
main ←── CI/CD ←── MR ←── feature/branch
                   └── automated merge on approval
```

- Branch from main: `git checkout -b type/description`
- Work and commit on branch
- When done: create MR via `gh pr create` / `glab mr create`
- Do NOT merge locally - CI/CD handles merge
- Branch naming: see `Git Workflow > Branch Convention` in `.specflow/config.md`

## Documentation Update Rules

### Always Update (every session)

- `SESSION_LOG.md` - Prepend new entry with session summary

### Update When Changed

| Document | Update When |
|----------|-------------|
| `ROADMAP.md` | Tasks complete, priorities change |
| `OVERVIEW.md` | System architecture changes |
| `ADR.md` | Significant technical decision made (append only) |
| `VISION.md` | Product direction pivots |
| `WORKFLOW.md` | Process changes |

### Never Update

- `feature_docs/*/SPEC.md` - Feature north star (frozen after creation)

## Metrics Policy

**No manual metrics.** Do not track:
- Test counts
- Coverage percentages
- Lines of code
- Velocity numbers

If metrics are needed, they must be:
- Generated automatically by CI/scripts
- Stored in auto-generated artifacts (not hand-edited docs)

## Session Commands

| Command | When to Use |
|---------|-------------|
| `/plan-session` | Before starting work |
| `/start-session` | Beginning implementation |
| `/end-session` | Wrapping up, merging |

Skills are installed once per machine in `~/.claude/skills/` and read project
facts from `.specflow/config.md`. They are not copied into this repository.

## Quick Reference

```bash
# Start work
git checkout main && git pull
git checkout -b feat/my-feature
# ... code ...

# End work
every command under `## Commands` → `### Test` in `.specflow/config.md`
git add . && git commit -m "feat: description"
Merge or open a PR per `Git Workflow > Type`
```

## Getting Help

- Architecture questions → Check `ADR.md`, then ask
- Current priorities → Check `ROADMAP.md`
- Recent context → Check `SESSION_LOG.md`
- System understanding → Check `OVERVIEW.md`
