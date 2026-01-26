# End Session

> Wrap up SpecFlow development session: validate, document, commit, push.

---

## Step 1: Final Validation

SpecFlow has no automated tests. Manually verify:
- Template syntax is correct (Handlebars, Markdown)
- Variable references match expected schema
- Documentation is clear and accurate
- Examples are realistic

---

## Step 2: Update ROADMAP

Edit `docs_specflow/ROADMAP.md`:

1. **Mark task complete**: Check the box for completed task
2. **Move to Done**: If "Now" section is cluttered, move completed items to "Done" with date
3. **Add blockers**: If you discovered new issues, add them

Example:
```markdown
## Now
- [x] Update plan-session template [feature: infrastructure]  ← Check this
- [ ] Add CLAUDE.md examples [feature: infrastructure]

## Done
- [x] Update plan-session template [feature: infrastructure] - 2026-01-20
```

---

## Step 3: Log Session

Prepend entry to `docs_specflow/SESSION_LOG.md`:

```markdown
## [{{FEATURE_NAME}}] {{CURRENT_DATE}}

**Task**: [Task description from ROADMAP]
**Branch**: {{CURRENT_BRANCH}}

### Summary
- [What was accomplished]

### Files Changed
- [List key files modified]

### Decisions
- [Design decisions made, or "None"]

### Blockers
- [Issues encountered, or "None"]

### Next
- [Suggested next task]

---
```

---

## Step 4: Update Architecture Docs (If Needed)

Only if significant changes occurred:

**docs_specflow/SPEC.md** (feature-specific):
- Update "Implementation Decisions" section
- Move resolved items from "Open Questions"

**docs_specflow/ADR.md** (project-wide):
- Add entry if major architectural decision was made

**docs_specflow/OVERVIEW.md**:
- Update if framework architecture changed

**README.md**:
- Update if user-facing features changed

---

## Step 5: Commit All Changes

```bash
git status
git add .
git commit -m "feat|fix|refactor|docs: [description]

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Step 6: Push to GitHub

Solo workflow - push directly to main:

```bash
git push origin main
```

For larger features, create PR:
```bash
git push -u origin {{CURRENT_BRANCH}}
gh pr create --title "feat: [description]" --body "## Summary
[What was done]

## Validation
- Manual review of templates
- Documentation updated
- Examples tested with sample variables
"
```

---

## Step 7: Session Summary

Provide brief summary to user:

```
Session complete!

**Accomplished**: [1-2 sentences]
**Files changed**: [count] files
**Validation**: Manual review ✓
**Next**: [Suggested next task from ROADMAP]
```

---

## Notes

- Always update ROADMAP and SESSION_LOG
- Keep session logs concise - key decisions only
- Feature tags help track work across worktrees
- Manual validation required - no automated tests for templates
- Push frequently to keep GitHub repo in sync
