# Documentation

> Follow these conventions for all documentation updates.

## Where things live

Paths come from `.specflow/config.md`. Read them there — do not assume `docs/`.

| What | Config key |
|---|---|
| Documentation root | `Documentation > Docs Path` |
| Task list | `Documentation > Tasks File` |
| Session journal | `Documentation > Session Log` |

- All documentation lives under the docs path. Do not create documentation files
  outside it.
- Feature-specific docs go in `<docs path>/feature_docs/<feature-name>/`.
- The tasks file and session log are named explicitly in the config because
  projects rename them. Writing to an assumed `ROADMAP.md` in a project that
  uses something else creates a second, ignored task list.

## Tasks file

- Update it immediately when a task changes status, not at the end of the day.
- Tag every task with `[feature: name]`. Untagged tasks will not be filtered
  correctly.
- Check the box `[x]` when a task is complete. Move it to the "Done" section
  with a date.
- Add new tasks or blockers discovered during implementation.

## Session log

- Prepend a new entry at the end of every session. Newest first.
- Use the heading format: `## [feature-name] YYYY-MM-DD`.
- Include: task, summary, files changed, decisions, blockers, next steps.
- Keep entries concise. Focus on decisions made, not keystrokes.

## Frozen documents

These have restricted editing rules:

- **VISION.md** — do not modify without explicit user approval.
- **SPEC.md** — requirements are frozen once approved. Add notes in the
  "Implementation Decisions" section only.
- **ADR.md** — append-only. Never edit or delete existing entries. Add new
  entries at the top.

## Sequencing doc edits and commits

When a task ends with both documentation edits and a commit, **finish the edits
first and verify they landed.** If an edit fails, the commit must not run.

A commit that carries code but not its documentation is worse than no commit:
the task looks done, the session log has no record of it, and the next session
starts from a false picture. This has happened — a doc script aborted partway
while its `git commit` ran anyway, producing a code-only commit.

## When to update

| Event | Update |
|---|---|
| Task completed | tasks file |
| Session ends | session log |
| Architecture changes | `<docs path>/OVERVIEW.md` |
| Design decision made | `<docs path>/ADR.md` |
| New feature planned | `<docs path>/feature_docs/<name>/SPEC.md` |

## General rules

- Write for the next session. Assume the reader has no context from this one.
- Use feature tags consistently. Mismatched tags break filtering.
- Do not duplicate information across documents. Reference other docs instead.
- Keep documentation factual. No aspirational language or vague plans.
