# Start Session

> Plan approved. Verify environment and begin implementation for SpecFlow.

---

## Step 1: Confirm Context

```bash
git branch --show-current
git status
```

- Feature from branch should match the plan
- Working directory should be clean (or save WIP first)

---

## Step 2: Pre-flight Check

SpecFlow has no automated tests. Instead, verify:
- Recent changes haven't broken template structure
- Any manually created test files are valid

---

## Step 3: Implement

Follow the approved session plan step-by-step:

1. **Read relevant templates/prompts** before making changes
2. **Implement incrementally** - small, testable chunks
3. **Commit frequently** with clear messages
4. **Validate often** - check template syntax, variable usage

### Commit Convention
```bash
feat|fix|refactor|docs: [clear description]
```

Examples:
- `feat: add explore-project command template`
- `fix: correct variable reference in plan-session`
- `refactor: simplify end-session workflow steps`
- `docs: update ROADMAP with completed tasks`

---

## Step 4: Track Progress

As you work:
- Note any **decisions** made (for session log)
- Document **blockers** encountered (for ROADMAP)
- Track **files changed** (for session log)
- Consider if decisions need ADR entry

---

## Guidelines

- **Stay focused**: One task per session
- **Validate templates**: Ensure Handlebars syntax is correct
- **Commit often**: After each logical change
- **Ask if stuck**: Don't spend >15min debugging alone
- **No backup files**: Use git branches instead
- **Test variables**: Make sure {{VARIABLE}} references match config schema

---

## When Done

Run `/end-session` to:
1. Final validation of changes
2. Update ROADMAP (mark task complete)
3. Log session in SESSION_LOG
4. Commit and push to GitHub
