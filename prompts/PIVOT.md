# Pivot Session Prompts

> Extended prompts for different pivot scenarios.

---

## General Pivot

When things feel off-track but you're not sure why.

```
Let's do a project health check and pivot if needed.

## 1. Audit Current Documentation

Review and report on:
- ROADMAP.md: Are tasks current? Any stale items?
- SESSION_LOG.md: What patterns in recent sessions?
- VISION.md: Still aligned with what we're building?
- OVERVIEW.md: Matches actual system?
- ADR.md: Any decisions that aren't being followed?

## 2. Identify Issues

Look for:
- Tasks that keep getting pushed to "Later"
- Recurring blockers in session logs
- Drift between docs and reality
- Scope creep or feature bloat
- Tech debt accumulating

## 3. Propose Corrections

For each issue found:
- What should change?
- Which docs need updating?
- Are there decisions to make?

Present findings and wait for direction before making changes.
```

---

## Tech Stack Pivot

When technology choices need to change.

```
We need to evaluate and potentially change our tech stack.

## 1. Current State
Review TECH_SPEC and ADR.md:
- What's the current stack?
- Why were these choices made?
- What problems have emerged?

## 2. Proposed Change
- What technology is changing?
- Why is the change needed?
- What's the replacement?

## 3. Impact Analysis
- What code needs to change?
- What documentation needs updating?
- What new patterns are needed?
- What's the migration path?

## 4. Decision Record
Draft an ADR entry:
- Context: Why this change is needed
- Decision: What's changing
- Consequences: Impact on project
- Migration: How we'll transition

## 5. Update Documentation
After approval:
- ADR.md: Add new entry
- OVERVIEW.md: Update architecture
- VISION.md: Update tech stack section
- .ai/agents/*: Update patterns
- .claude/commands/*: Regenerate if workflow affected

## 6. Create Migration Tasks
Add to ROADMAP.md:
- Migration steps as tasks
- Priority relative to other work
```

---

## Feature Pivot

When a feature is scrapped or significantly changed.

```
A feature is being pivoted or scrapped. Let's update documentation.

## 1. Identify Affected Items

Which feature is changing?
- Current state in ROADMAP
- Related ADR entries
- Mentions in OVERVIEW
- Related session log entries

## 2. Determine Action

Is this feature being:
- **Scrapped**: Remove from roadmap, document why
- **Deferred**: Move to Later with note
- **Changed**: Update description, may need new ADR

## 3. Update Documentation

### For Scrapped Features:
- Remove from ROADMAP (Now/Next)
- Add note to VISION.md pivot history
- Add ADR if significant ("ADR-X: Decided not to build Y")

### For Deferred Features:
- Move to Later in ROADMAP
- Add note about why deferred
- No ADR needed unless architectural

### For Changed Features:
- Update ROADMAP description
- Update OVERVIEW if scope changed
- Add ADR if approach changed significantly

## 4. Clean Up
- Remove any WIP code if scrapped
- Update related tasks
- Adjust priorities in Now/Next
```

---

## Process Pivot

When how you work needs to change.

```
We need to update our development process.

## 1. Current Process
Review WORKFLOW.md:
- Current git workflow
- Session lifecycle
- Documentation practices

## 2. What's Changing
- Git workflow? (solo → team, or vice versa)
- Review process?
- CI/CD setup?
- Integrations?

## 3. Update Configuration

### If Git Workflow Changed:
- Update WORKFLOW.md
- Regenerate .claude/commands/
- Update any scripts (merge-to-main.sh, etc.)

### If Integrations Changed:
- Update WORKFLOW.md
- Update CLAUDE.md
- Adjust commands if needed

### If Team Structure Changed:
- Update WORKFLOW.md
- Update .ai/agents/ if roles changed

## 4. Communicate Change
- Document in SESSION_LOG as pivot session
- Ensure all docs are consistent with new process
```

---

## Roadmap Reset

When the roadmap is significantly out of date.

```
The roadmap needs a complete refresh.

## 1. Audit Current Roadmap
- What's in Now? Is it accurate?
- What's in Next? Still relevant?
- What's in Later? Worth keeping?
- What's in Done? Anything missing?
- What blockers exist?

## 2. Gather Current Priorities
Ask:
- What are the actual current priorities?
- What should we be working on now?
- What's been deprioritized?
- What new work has emerged?

## 3. Rebuild Roadmap

### Now (Current)
- Should be 1-2 active tasks max
- Clear, actionable scope

### Next (Priority Queue)
- Ordered by priority
- Ready to start when Now is done

### Later (Backlog)
- Ideas and future work
- Not prioritized

### Done (Recent)
- Last 5-10 completed items
- For context, not exhaustive history

### Blockers
- Active blockers only
- Include resolution path if known

## 4. Sync Other Docs
Ensure consistency:
- OVERVIEW.md reflects actual state
- SESSION_LOG.md recent entries align
- No orphaned references
```

---

## Quarterly/Monthly Review

For longer-running projects, periodic pivot sessions.

```
Time for a periodic project review.

## 1. Progress Review
Look at SESSION_LOG.md:
- Sessions completed since last review
- Major accomplishments
- Recurring issues

## 2. Roadmap Health
- How much of original roadmap completed?
- What pivoted or was scrapped?
- What new work emerged?
- Is scope manageable?

## 3. Documentation Health
For each doc, check:
- Is it up to date?
- Does it match reality?
- Is it being used?

## 4. Technical Health
- Any tech debt accumulated?
- Any ADRs that need revisiting?
- Patterns working well or poorly?

## 5. Process Health
- Is the session workflow working?
- Any friction points?
- Commands still appropriate?

## 6. Action Items
Based on review:
- Docs to update
- Process to adjust
- Technical items to address
- Priorities to reconsider

Create tasks in ROADMAP for any significant items.
```

---

## Pivot Session Log Format

```markdown
## Session: YYYY-MM-DD (Pivot)

**Type**: Pivot session
**Trigger**: [Why this pivot was needed]

### Changes Made

**Strategic:**
- VISION.md: [changes or "no change"]
- ADR.md: [new entry added? which?]

**Tactical:**
- ROADMAP.md: [what changed]
- OVERVIEW.md: [changes or "no change"]
- WORKFLOW.md: [changes or "no change"]

**Operational:**
- Commands regenerated: [yes/no]
- Agents updated: [which ones]

### Decisions Made
- [Key decisions and rationale]

### Impact
- [How this affects upcoming work]

### Next
- [What happens next]

---
```
