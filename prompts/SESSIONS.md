# Session Prompts

> Prompts for running SpecFlow sessions. These are templates - actual commands are generated during setup with your specific configuration.

---

## Plan Session

```
Read CLAUDE.md to get project context.

Then check the current state:
- docs_specflow/ROADMAP.md - for current and upcoming tasks
- docs_specflow/SESSION_LOG.md (last 3 entries) - for recent context
- docs_specflow/OVERVIEW.md - for system understanding
- docs_specflow/ADR.md - for relevant decisions

Create a session plan including:
- Session goal: ONE task from ROADMAP (Now or top of Next)
- Implementation steps: Concrete actions to complete the task
- Files likely to change: Based on the task
- Success criteria: How we know it's done
- Questions/blockers: Anything unclear before starting

Do NOT start implementing yet. Present the plan for approval.
```

---

## Start Session

```
The session plan has been approved. Begin implementation.

## 1. Verify Environment
Run baseline checks:
- Run tests to verify nothing is broken: [TEST_COMMAND]
- Check for uncommitted changes: git status

If checks fail, fix before proceeding with new work.

## 2. Create Feature Branch
- Ensure on main and up to date: git checkout main && git pull
- Create branch: git checkout -b [BRANCH_CONVENTION]/[description]

Branch naming: [BRANCH_CONVENTION]
Examples: feat/user-auth, fix/login-bug, refactor/api-cleanup

## 3. Determine Role
Based on the task, read the appropriate agent guide:
- Backend work → .claude/agents/backend.md
- Frontend work → .claude/agents/frontend.md
- Testing → .claude/agents/qa.md
- Architecture → .claude/agents/architecture.md

## 4. Begin Implementation
- Mark task as in_progress (use TodoWrite if available)
- Follow the plan step by step
- Commit frequently with clear messages
- Note any decisions or blockers as you go

Remember: Stay within scope. One task, one session.
```

---

## End Session

```
Implementation is complete. Wrap up the session.

## 1. Run Tests
Verify all tests pass:
[TEST_COMMAND]

If tests fail, fix them before proceeding.

## 2. Update Documentation

### Always Update:
- docs_specflow/ROADMAP.md
  - Mark completed task as done (move to Done section)
  - Adjust Now/Next if priorities changed
  - Add any new blockers discovered

- docs_specflow/SESSION_LOG.md
  - Prepend new entry with today's date
  - Include: role, task, files changed, summary, decisions, next steps

### Update If Changed:
- docs_specflow/OVERVIEW.md - if architecture or system description changed
- docs_specflow/ADR.md - if significant technical decision was made (append only)

## 3. Final Commit
Ensure all changes are committed:
- git status (check for uncommitted files)
- git add . && git commit -m "type: description"

## 4. Merge/PR

[GIT_WORKFLOW_SPECIFIC_INSTRUCTIONS]

## 5. Session Summary
Provide a brief summary:
- What was accomplished
- Any issues encountered
- Suggestions for next session
```

---

## End Session - Git Workflow Variants

### Solo (Direct Merge)

```
## 4. Merge to Main

Option A - Use merge script:
./scripts/merge-to-main.sh

Option B - Manual merge:
git checkout main
git pull origin main
git merge [branch-name]
git push origin main
git branch -d [branch-name]

Verify: git log -1 shows your changes on main
```

### PR Review (GitHub)

```
## 4. Create Pull Request

Push branch:
git push -u origin [branch-name]

Create PR:
gh pr create --title "[type]: [description]" --body "## Summary
- [what was done]

## Test Plan
- [how to verify]

## Related
- Task: [ROADMAP reference]
"

Do NOT merge - wait for review.
PR URL: [will be shown after creation]
```

### PR Review (GitLab)

```
## 4. Create Merge Request

Push branch:
git push -u origin [branch-name]

Create MR:
glab mr create --title "[type]: [description]" --description "## Summary
- [what was done]

## Test Plan
- [how to verify]
"

Do NOT merge - wait for review and CI.
```

### CI/CD Gated

```
## 4. Create Merge Request

Push branch:
git push -u origin [branch-name]

Create MR:
glab mr create \
  --title "[type]: [description]" \
  --description "[summary]" \
  --remove-source-branch

The CI/CD pipeline will handle merge after approval.
Check status: glab mr view

Do NOT attempt local merge.
```

---

## Pivot Session

```
This is a pivot session to reassess project direction.

## 1. Review Current State

Check these documents:
- docs_specflow/ROADMAP.md - Is this still accurate?
- docs_specflow/VISION.md - Is the direction still valid?
- docs_specflow/SESSION_LOG.md (last 5-10 entries) - What patterns emerge?
- docs_specflow/ADR.md - Any decisions that need revisiting?

## 2. Identify Drift

Answer these questions:
- Is the ROADMAP aligned with current priorities?
- Have any features been scrapped or pivoted?
- Is the tech stack still appropriate?
- Are there recurring blockers?
- Has the product direction changed?

## 3. Update Strategic Docs (if needed)

### VISION.md
- Update if product direction changed
- Add entry to Pivot History section

### ADR.md
- Add entry if technical direction changed
- Never modify existing entries

## 4. Update Tactical Docs

### ROADMAP.md
- Remove stale/cancelled tasks
- Reprioritize Now/Next/Later
- Clear resolved blockers, add new ones

### OVERVIEW.md
- Update if system description is outdated
- Ensure it matches current reality

## 5. Regenerate Commands (if needed)

If tech stack or git workflow changed:
- Update configuration
- Regenerate .claude/commands/
- Update .claude/agents/ if patterns changed

## 6. Document the Pivot

Add to SESSION_LOG.md:
- Type: Pivot session
- What changed and why
- Impact on upcoming work

## 7. Summary

Provide:
- What was realigned
- What documentation changed
- Recommended next steps
```

---

## Quick Reference

| Session Type | When | Key Actions |
|-------------|------|-------------|
| Plan | Before work | Review context, pick ONE task, create plan |
| Start | Beginning work | Create branch, read agent guide, begin |
| End | After work | Test, update docs, merge/PR |
| Pivot | Direction unclear | Review all docs, realign, update |
