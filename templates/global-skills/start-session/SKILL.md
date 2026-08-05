---
name: start-session
description: >-
  Begin implementation after plan approval. Confirms context, runs pre-flight
  tests, records a failure baseline, suggests specialist agents, and sets up the
  implementation environment. Use after plan-session approval.
compatibility: Works with Claude Code, Codex CLI, and other Agent Skills-compatible tools
metadata:
  author: specflow
  config_schema: 1
---
# Start Session

> Plan approved. Verify the environment and begin implementation.

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

## Step 1: Confirm context

```bash
git branch --show-current
git status
```

- The feature implied by the branch should match the plan.
- The working tree should be clean, or WIP should be saved first.

**Check for a plan file (Claude Code):** if a plan from `plan-session` exists in
`~/.claude/plans/`, read the most recent one. If not, the plan was delivered
inline — proceed from conversation context.

**Read project-specific context**, resolving `<docs>` from `Documentation >
Docs Path`:

- `<docs>/ORCHESTRATION.md` — session lifecycle, delegation, checkpoints
- `<docs>/CUSTOM.md` — custom commands, conventions, gotchas

---

## Step 2: Pre-flight check and failure baseline

Run **every** command listed under `## Commands` → `### Test` in the config.
Not the first one — all of them. A repo with a backend and a frontend has two
suites, and a baseline taken from one of them is not a baseline.

Record which tests fail and **what each failure says**. This is the comparison
point for the rest of the session: anything failing at the end that was not
failing now, or that fails now with a different message, is yours.

If tests fail:

1. Check each failure against `## Known Test Failures` — by message, not by
   file path.
2. Fix simple issues directly.
3. For complex build or test failures, consider a build-diagnostics specialist
   agent if one is installed in `.claude/agents/`.

If the observed baseline differs from what the config records, mention it. Do
not silently rewrite the config mid-session — offer to update it at the end.

---

## Step 3: Consider specialist agents

If specialist agents are installed in `.claude/agents/`, consider invoking them
for focused expertise:

| Task type | Look for an agent that... | Pattern |
|---|---|---|
| New API endpoint or backend logic | Specializes in backend/API development | Sequential: implement, then test |
| New UI component or page | Specializes in frontend/UI development | Sequential: implement, then test |
| Full-stack feature | Reviews architecture, then backend + frontend | Parallel implementation |
| Refactoring | Specializes in code cleanup/complexity | Sequential: refactor, then test |
| Build/test failures | Specializes in build diagnostics | Immediate |
| Security-sensitive changes | Specializes in security auditing | Post-implementation review |

**Tips:**

- Run independent agents in parallel; run dependent agents sequentially.
- Assign explicit file or module ownership to any agent that may edit.
- Keep the primary session responsible for integration and final verification.
- Not every task needs a specialist. Simple changes are fine without one.

> No agents installed? Skills work fine without them. Community agents:
> https://github.com/VoltAgent/awesome-claude-code-subagents

---

## Step 4: Implement

Follow the approved plan step by step:

1. **Read the relevant code** before changing it.
2. **Implement incrementally** — small, testable chunks.
3. **Commit frequently** with clear messages.
4. **Run tests often** — catch issues early.
5. **Invoke specialist agents** when you hit their domain.

### Renames and sweeps

When a change renames a symbol, string or file, sweep for **every** occurrence
before calling it done. Search **case-insensitively**, and search test files and
fixtures, not just source. A case-sensitive grep for a renamed UI string once
missed two test files, and the resulting breakage reached the branch disguised
as known flakiness.

### Commit convention

Follow `Git Workflow > Commit Convention` from the config. Where that is
`conventional`:

```
type: clear description
```

If `Integrations > Ticketing` is not `none`, include the ticket reference using
the pattern in `Integrations > Ticket Format`.

Examples:

- `feat: add user authentication endpoint`
- `fix: handle null values in login form`
- `refactor: extract validation logic to a separate module`
- `test: add edge cases for password reset`

---

## Step 5: Track progress

As you work, note:

- **Decisions** made — for the session log
- **Blockers** encountered — for the tasks file
- **Files changed** — for the session log
- Whether any decision warrants an ADR entry

---

## Guidelines

- **Stay focused:** one task per session.
- **Test continuously:** do not accumulate untested code.
- **Commit often:** after each logical change.
- **Ask if stuck:** do not spend more than ~15 minutes debugging alone.
- **No backup files:** use git branches instead.

---

## When done

Run `end-session` to run final verification, update the tasks file, log the
session, and commit.
