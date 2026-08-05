---
name: end-session
description: >-
  Wrap up a development session. Runs final verification, updates the task file,
  logs the session, commits, and merges or opens a PR. Use when done coding.
compatibility: Works with Claude Code, Codex CLI, and other Agent Skills-compatible tools
metadata:
  author: specflow
  config_schema: 1
---
# End Session

> Wrap up implementation: verify, document, commit, merge or PR.

**Expected config schema: 1**

---

## Reading project config

Before doing anything else, read `.specflow/config.md` from the repository root.
This is the only place project facts come from. Do not detect a stack, derive a
test command, or infer a docs path — all of it is in that file.

**If the file does not exist**, stop and say:

> This project has not been initialised for SpecFlow. Run `specflow-init` to set
> it up.

Do not guess, do not half-run, and do not fall back to defaults. A skill that
invents `docs/ROADMAP.md` because it found no config will silently write to the
wrong file in a project that uses something else.

**If it exists**, compare `SpecFlow > Config Schema` in the file against the
schema this skill expects (stated above):

| Situation | What to do |
|---|---|
| The file's schema is **lower** | Migration is needed. Consult the migration manifest, apply only the changes it marks `auto`, and mention any `decision` items as deferrable. Then continue with the task. |
| The schemas are **equal** | Proceed. Write nothing to the config. |
| The file's schema is **higher** | This machine's SpecFlow is stale. Warn the user, proceed read-only, and change nothing. |

Three rules govern this, and none of them bend:

1. **Never lower `Config Schema`.** Recording a lower number relabels a newer
   config as older and destroys the mismatch signal permanently — the next run
   sees no problem to report.
2. **A no-op writes nothing.** The config is git-tracked. Writing it just to
   restamp a version produces a commit-worthy diff on every machine after every
   release, and a merge conflict on shared repos.
3. **Never let a migration hijack the session.** The user asked for the task in
   hand, not a setup interview. Auto-apply what is additive, offer the rest, and
   finish what was asked either way.

This skill commits documentation anyway. If a deferred version bump is pending,
let it ride along with this session's commit rather than making a commit of its
own.

### Paths and commands

- Path values carry no trailing slash by convention, but **tolerate both** —
  existing projects are inconsistent.
- `Documentation > Tasks File` and `Session Log` are explicit. Use them. Do not
  assume `ROADMAP.md` or `SESSION_LOG.md` under the docs path.
- Every `## Commands` entry is a **list**, and every entry runs from the
  repository root. When a task says "run the tests", run **all** entries under
  `### Test`, not the first one.

### Known test failures

`## Known Test Failures` is a baseline, not a licence. Before attributing an
observed failure to it:

1. Read the observed failure's **message**.
2. Compare it against the recorded `Message` for that test.
3. Only if they match may you treat it as pre-existing.

**Matching on test path alone is forbidden.** A test listed in the baseline can
still break for a new reason, and waving it through on filename converts a loud
failure into a silent one. This has already happened once: an incomplete rename
broke two tests in a file marked known-flaky, and the regression reached the
branch because nobody read the message.

If the failure is new, or the message differs, it is yours. Fix it.

---

## Step 1: Final verification

Run **every** command in the config under `### Test`, `### Lint`, `### Build`
and `### Typecheck`. All entries in each list.

Fix failures before proceeding. Compare anything still failing against the
baseline from `start-session` — by message, not by path.

**Optional quality reviews** for significant changes. If specialist agents are
installed in `.claude/agents/`, run applicable reviews in parallel:

| When to use | Look for an agent that... |
|---|---|
| Added substantial code | Reviews test coverage and suggests missing cases |
| Changed auth, data handling, or secrets | Audits for OWASP Top 10, secrets, injection |
| Large implementation or refactor | Reviews for dead code and unnecessary complexity |

These are advisory. Follow `<docs>/ORCHESTRATION.md` for reviewer handoff, and
keep the primary session responsible for deciding which findings to apply.

---

## Documentation before commit

Steps 2–4 edit documentation. Step 5 commits. **That order is mandatory, and a
failure in any of steps 2–4 must abort the commit.**

A commit carrying code but not its documentation is worse than no commit: the
task looks done, the session log has no record of it, and the next session
starts from a false picture. This has happened — a doc script aborted partway
while its `git commit` ran anyway, producing a code-only commit.

Verify each doc edit landed before moving on. Do not batch the edits and the
commit into one unchecked sequence.

---

## Step 2: Update the tasks file

Edit the file named by `Documentation > Tasks File`:

1. **Mark the task complete** — check its box.
2. **Move to Done** if the "Now" section is cluttered, with a date.
3. **Add blockers** you discovered.

```markdown
## Now
- [x] Add login endpoint [feature: user-auth]   ← check this
- [ ] Add password reset [feature: user-auth]

## Done
- [x] Add login endpoint [feature: user-auth] - 2026-01-20
```

---

<a id="session-log-entry"></a>

## Step 3: Log the session

Prepend an entry to the file named by `Documentation > Session Log`. Other
skills reference this format by name — `end-session` → *Session log entry*.
Keep the anchor stable if you edit it.

```markdown
## [{{FEATURE_NAME}}] {{CURRENT_DATE}}

**Task**: [task description from the tasks file]
**Branch**: {{CURRENT_BRANCH}}

### Summary
- [What was accomplished]

### Files Changed
- [Key files modified]

### Decisions
- [Design decisions made, or "None"]

### Blockers
- [Issues encountered, or "None"]

### Next
- [Suggested next task]

---
```

---

## Step 4: Update architecture docs if needed

Only when significant changes occurred. Resolve `<docs>` from
`Documentation > Docs Path`:

- `<docs>/feature_docs/<feature>/SPEC.md` — update "Implementation Decisions",
  move resolved items out of "Open Questions". Requirements sections stay frozen.
- `<docs>/ADR.md` — append an entry for a major architectural decision. Never
  edit existing entries.
- `<docs>/OVERVIEW.md` — update if the system architecture changed.

---

## Step 5: Commit

Confirm the doc edits from steps 2–4 are on disk first. If any failed, stop and
report — do not commit.

```bash
git status
git add .
```

Commit following `Git Workflow > Commit Convention`. If
`Integrations > Ticketing` is not `none`, include the ticket reference using
`Integrations > Ticket Format`.

---

<a id="merge-or-pr"></a>

## Step 6: Merge or open a PR

Read `Git Workflow > Type` and `Git Workflow > Default Branch` from the config.
**Never hardcode `main`.**

Other skills reference this step by name — `end-session` → *Merge or open a PR*.
Some deliberately skip it; keep the anchor stable.

### Solo

```bash
git checkout <default branch>
git pull origin <default branch>
git merge <current branch>
git push origin <default branch>
git branch -d <current branch>
```

### Team

```bash
git push -u origin <current branch>
```

Then open a PR (`gh pr create`) or MR (`glab mr create`) with a summary and a
test plan listing **every** test command from the config. Wait for review — and
for CI where it runs — before merging.

---

## Step 7: Session summary

```
Session complete!

**Accomplished**: [1-2 sentences]
**Files changed**: [count] files
**Verification**: [which command lists passed]
**Next**: [suggested next task]
```

---

## Notes

- Always update the tasks file and session log.
- Keep session logs concise — key decisions only.
- Feature tags track work across worktrees.
- Verify before committing, always.
- Capture orchestration blockers and delegated-review findings in the session log
  when they affect the result.
- Check `<docs>/CUSTOM.md` for project-specific commit conventions or PR
  templates.
