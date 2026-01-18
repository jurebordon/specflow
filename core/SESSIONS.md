# Session Workflow

Work in SpecFlow happens in **sessions** - focused units of work with clear boundaries. This document defines the session lifecycle.

## Session Types

| Type | Purpose | When to Use |
|------|---------|-------------|
| **Plan** | Prepare for implementation | Before starting work |
| **Implementation** | Write code, tests, docs | During active development |
| **End/Wrap-up** | Commit, merge, document | After completing work |
| **Pivot** | Reassess direction | When roadmap feels stale or priorities shift |

## Session Lifecycle

```
┌──────────────────────────────────────────────────────────────────┐
│                         PLAN SESSION                              │
│  • Review ROADMAP.md, pick ONE task                              │
│  • Read last 3 SESSION_LOG entries                               │
│  • Check ADR.md for relevant decisions                           │
│  • Create implementation plan                                     │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATION SESSION                         │
│  • Create feature branch                                          │
│  • Implement within scope                                         │
│  • Commit frequently                                              │
│  • Note any decisions or blockers                                │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                        END SESSION                                │
│  • Run tests, verify everything passes                           │
│  • Update ROADMAP.md (mark done, update Next)                    │
│  • Append entry to SESSION_LOG.md                                │
│  • Merge per git workflow (direct, PR, or MR)                    │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                     [Next session...]

         ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                       PIVOT SESSION                               │
│  (When direction needs reassessment)                              │
│  • Review ROADMAP vs reality                                      │
│  • Update VISION.md if direction changed                         │
│  • Add ADR if architecture decisions made                        │
│  • Regenerate commands if tech/workflow changed                  │
└──────────────────────────────────────────────────────────────────┘
```

## Plan Session

**Goal**: Prepare for focused implementation work.

### Steps

1. **Read context**
   - `CLAUDE.md` (or root context file) for project overview
   - `ROADMAP.md` for current priorities
   - Last 3 entries in `SESSION_LOG.md` for recent history
   - Relevant sections of `ADR.md`

2. **Select ONE task**
   - Pick from "Now" or top of "Next" in ROADMAP
   - Resist scope creep - one task per session

3. **Create implementation plan**
   - Break task into concrete steps
   - Identify files likely to change
   - Note any unknowns or questions

4. **Verify environment** (optional but recommended)
   - Run tests to confirm baseline is healthy
   - Check for uncommitted changes

### Output

A clear plan with:
- Session goal (one sentence)
- Implementation steps
- Files to modify
- Success criteria
- Questions/blockers to resolve first

## Implementation Session

**Goal**: Execute the plan, produce working code.

### Steps

1. **Create branch** (per project's git workflow)
   ```bash
   git checkout -b type/short-description
   # Examples: feat/user-auth, fix/login-bug, refactor/api-cleanup
   ```

2. **Determine role**
   - Backend work → Read `.ai/agents/backend.md`
   - Frontend work → Read `.ai/agents/frontend.md`
   - Testing focus → Read `.ai/agents/qa.md`
   - Architecture changes → Read `.ai/agents/architecture.md`

3. **Implement**
   - Follow the plan
   - Stay within scope
   - Commit frequently (logical chunks)
   - Note decisions made along the way

4. **Handle blockers**
   - If blocked, document in session notes
   - Either resolve or add to ROADMAP blockers
   - Don't let scope creep disguise itself as "necessary"

### Guidelines

- **One task, one branch** - Don't mix unrelated changes
- **Commit messages** - Clear, conventional format
- **Tests** - Write/update tests for changes
- **No backup files** - Git is your safety net

## End Session

**Goal**: Clean up, document, merge.

### Steps

1. **Verify tests pass**
   ```bash
   # Run your project's test command
   pytest / npm test / go test / etc.
   ```

2. **Update documentation**

   **Always update:**
   - `ROADMAP.md` - Move task to Done, update Now/Next
   - `SESSION_LOG.md` - Prepend session entry

   **Update if relevant:**
   - `OVERVIEW.md` - If system architecture changed
   - `ADR.md` - If significant decisions were made

3. **Final commit**
   - Ensure all changes are committed
   - Clear commit message summarizing the session

4. **Merge** (per project's git workflow)

   | Workflow | Action |
   |----------|--------|
   | Solo | Merge to main, delete branch |
   | PR-Review | Create PR, wait for review |
   | CI/CD Gated | Create MR, let CI handle merge |

5. **Summary**
   - What was accomplished
   - Any issues encountered
   - Suggestions for next session

### Session Log Entry Format

```markdown
## Session: YYYY-MM-DD

**Role**: backend / frontend / qa / architecture
**Task**: [Task name from ROADMAP]
**Branch**: type/branch-name

### Summary
- Bullet points of what was accomplished

### Files Changed
- path/to/file1.py
- path/to/file2.ts

### Decisions
- Any design decisions (consider ADR if significant)

### Blockers
- Issues encountered (or "None")

### Next
- Suggested focus for next session

---
```

## Pivot Session

**Goal**: Reassess direction when things feel off-track.

### When to Trigger

- ROADMAP feels disconnected from reality
- Priorities have shifted significantly
- Tech stack or workflow needs to change
- Feature was scrapped or pivoted
- Multiple sessions ended with blockers

### Steps

1. **Assess current state**
   - Review ROADMAP.md vs what actually exists
   - Check SESSION_LOG for patterns (repeated blockers, scope changes)
   - Compare current direction to VISION.md

2. **Identify drift**
   - What changed since last alignment?
   - Are we building what we intended?
   - Are the tools/tech still appropriate?

3. **Update strategic docs** (if needed)
   - VISION.md - If product direction changed
   - ADR.md - If architecture decisions were made

4. **Update tactical docs**
   - ROADMAP.md - Reprioritize, remove stale items
   - OVERVIEW.md - If system description is outdated

5. **Regenerate commands** (if needed)
   - If tech stack changed
   - If git workflow changed
   - If new integrations added

6. **Document the pivot**
   - Add entry to VISION.md pivot history
   - Add ADR entry if technical direction changed
   - Log pivot session in SESSION_LOG

### Output

- Updated documentation reflecting current reality
- Clear next steps in ROADMAP
- Regenerated commands if workflow changed
- Pivot recorded for future reference

## Session Discipline

### Do

- Focus on ONE task per session
- Commit frequently
- Document decisions as you make them
- End sessions cleanly (tests pass, docs updated)

### Don't

- Mix unrelated changes in one session
- Skip the session log ("I'll remember")
- Let scope creep happen silently
- Leave uncommitted changes overnight

### When Stuck

1. Document the blocker clearly
2. Add it to ROADMAP blockers section
3. End the session cleanly
4. Start fresh next session with the blocker as context

## Commands Reference

Session commands are generated during setup based on your project's configuration. They live in `.claude/commands/` and can be invoked as slash commands in Claude Code or pasted into other AI assistants.

| Command | Purpose |
|---------|---------|
| `/plan-session` | Prepare for implementation |
| `/start-session` | Begin implementation work |
| `/end-session` | Wrap up and merge |
| `/pivot-session` | Reassess and realign |

See [prompts/SESSIONS.md](../prompts/SESSIONS.md) for the full prompt templates.
