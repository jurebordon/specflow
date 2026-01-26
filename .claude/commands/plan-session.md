# Plan Session

> Quick session planning for SpecFlow development: detect feature, read context, pick a task, create plan.

---

## Step 1: Detect Feature Context

```bash
git branch --show-current
```

Extract feature from branch name:
- `feat/user-auth` → `user-auth`
- `feature/api-v2` → `api-v2`
- `main` → Ask user which feature (or assume `infrastructure`)

---

## Step 2: Read Context Files

**Required**:
- `CLAUDE.md` - Project overview
- `docs_specflow/ROADMAP.md` - All tasks
- `docs_specflow/SESSION_LOG.md` - Last 2-3 entries only

**If feature detected**:
- `docs_specflow/feature_docs/{{FEATURE_NAME}}/SPEC.md` - Requirements (if exists)

**Optional** (only if unclear):
- `docs_specflow/OVERVIEW.md` - Architecture
- `README.md` - Framework overview

---

## Step 3: Filter & Pick Task

Find tasks in ROADMAP.md tagged `[feature: {{FEATURE_NAME}}]`:
- Pick first unchecked task from "Now" section
- If "Now" is empty, pick first from "Next" section

Show user:
```markdown
**Detected Feature**: {{FEATURE_NAME}}
**Next Task**: [task description from ROADMAP]
```

---

## Step 4: Create Implementation Plan

Present structured plan:

```markdown
## Session Plan: {{TASK_TITLE}}

**Feature**: {{FEATURE_NAME}}
**Branch**: {{CURRENT_BRANCH}}

### Steps
1. [Specific action 1]
2. [Specific action 2]
3. [Specific action 3]

### Files to Modify
- [file paths in templates/, prompts/, or docs_specflow/]

### Tests to Add/Update
- [Manual validation steps - no automated tests for templates]

### Success Criteria
- [ ] Implementation complete
- [ ] Templates render correctly with test variables
- [ ] Documentation updated
- [ ] [Other criteria]

### Questions
[Any blockers or unclear requirements]
```

---

## Step 5: Get Approval

**STOP - Do not implement yet.**

Ask: "Approve this plan to start implementation?"
- **Yes** → User runs `/start-session`
- **No** → Revise plan or pick different task

---

## Notes

- Keep plans focused: 1 task = 1 session
- If task is too large, suggest breaking it down in ROADMAP
- Feature detection is automatic - zero configuration
- Tasks without `[feature: name]` tags won't be filtered
- SpecFlow has no automated tests - validate by reviewing rendered output
