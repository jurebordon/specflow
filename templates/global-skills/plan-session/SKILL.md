---
name: plan-session
description: >-
  Plan the next development session. Detects the current feature from the git
  branch, reads project context, filters tasks by feature tag, and creates a
  structured implementation plan. Use at the start of any coding session.
compatibility: Works with Claude Code, Codex CLI, and other Agent Skills-compatible tools
metadata:
  author: specflow
  config_schema: 1
---
# Plan Session

> Detect the feature, read context, pick a task, create a plan.

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

---

## Step 0: Context check

If this conversation has significant prior history (multiple tool calls, long
outputs, prior implementation work), suggest:

> **Tip:** This session has existing context. For a clean planning slate, run
> `/clear` first, then re-run `plan-session`.

If the conversation is fresh, skip this step silently.

### Plan mode (Claude Code)

If the `EnterPlanMode` tool is available and plan mode is not already active,
call it to enter read-only planning mode. If the user declines or the tool is
unavailable, continue with inline planning.

If plan mode is already active, note the plan file path from the system
reminder.

---

## Step 1: Detect feature context

```bash
git branch --show-current
git status --short
```

If the working tree is dirty, say what is uncommitted before planning against
it. A plan built on an unknown state is a plan for a different repository.
`new-feature` in particular leaves its SPEC and roadmap edit uncommitted, so
running these two back to back hits this every time.

Extract the feature from the branch name:

- `feat/user-auth` → `user-auth`
- `feature/api-v2` → `api-v2`
- `PROJ-123-payment` → `payment`

If the current branch is the one named in `Git Workflow > Default Branch`, ask
the user which feature to plan for. **Read that key — do not test for `main`.**
A project on `trunk` or `develop` would otherwise slip past this check.

---

## Step 2: Read context files

Resolve `<docs>` from `Documentation > Docs Path`.

**Required:**

- `CLAUDE.md` — project overview
- The file named by `Documentation > Tasks File`
- The file named by `Documentation > Session Log` — last 2–3 entries only
- `<docs>/ORCHESTRATION.md` — session lifecycle and delegation rules, if present
- `<docs>/CUSTOM.md` — project-specific context, if present

**If a feature was detected:**

- `<docs>/feature_docs/{{FEATURE_NAME}}/SPEC.md` — requirements. **Its absence is
  normal and not an error**: only `new-feature` writes SPECs, so features that
  came from an adoption-mode init have none. Say you are planning without one
  and carry on — do not stop, and do not silently pretend you read it.

**Optional, only if something is unclear:**

- `<docs>/OVERVIEW.md` — architecture
- `<docs>/WORKFLOW.md` — commands

---

## Step 3: Filter and pick a task

In the tasks file, find entries tagged `[feature: {{FEATURE_NAME}}]`:

- Pick the first unchecked task from the "Now" section.
- If "Now" has none, pick the first from "Next".

Show the user:

```markdown
**Detected Feature**: {{FEATURE_NAME}}
**Next Task**: [task description from the tasks file]
```

---

## Step 4: Create the implementation plan

For complex architectural tasks, consider an architecture-specialist agent if
one is installed in `.claude/agents/`. Follow `<docs>/ORCHESTRATION.md` when
deciding whether to delegate: delegate only bounded work with clear ownership,
and keep the primary session responsible for integration.

<a id="plan-structure"></a>

### Plan structure

Other skills reference this section by name — `plan-session` → *Plan structure*.
Keep the anchor stable if you edit it.

```markdown
## Session Plan: {{TASK_TITLE}}

**Feature**: {{FEATURE_NAME}}
**Branch**: {{CURRENT_BRANCH}}

### Steps
1. [Specific action 1]
2. [Specific action 2]

### Files to Modify
- [file paths]

### Tests to Add/Update
- [test descriptions]

### Success Criteria
- [ ] Implementation complete
- [ ] Every command under `### Test` in the config passes
- [ ] [Other criteria]

### Questions
[Any blockers or unclear requirements]
```

List the actual test commands from the config in the success criteria rather
than the phrase above — and list **all** of them. A plan that names one suite in
a two-suite project sets a success bar that half the project never has to clear.

**If in plan mode:** write the plan to the plan file, exploring the codebase
with read-only tools first.

**If not in plan mode:** present the plan inline.

---

## Step 5: Get approval

**Stop. Do not implement yet.**

**If in plan mode:** call `ExitPlanMode` to present the plan. Do not also ask
"Approve this plan?" — `ExitPlanMode` handles approval. If rejected, revise and
call it again.

**When approval comes back, do not start editing.** The harness says "you can
now start coding"; this skill means something narrower. Approval here means *the
plan is right*, not *begin now* — implementation belongs to `start-session`,
which is where the failure baseline is taken and where the work gets a branch.
Skip it and both are silently missing for the rest of the session, and
`end-session` will compare against a baseline that was never recorded.

So on approval, say what was approved and hand over:

> Plan approved. Run `start-session` to begin — it takes the test baseline and
> branches for the work before any edit.

**If not in plan mode:** ask "Approve this plan to start implementation?"

- **Yes** → the user runs `start-session`
- **No** → revise, or pick a different task

---

## Notes

- Keep plans focused: one task, one session.
- If a task is too large, suggest breaking it down in the tasks file.
- Feature detection is automatic — zero configuration.
- Tasks without a `[feature: name]` tag will not be filtered.

## Specialist agents

If agents are installed in `.claude/agents/`, consider them during
implementation: architecture review, build diagnostics, testing and QA, security
auditing, refactoring, or domain-specific work.

> No agents installed? Community agents:
> https://github.com/VoltAgent/awesome-claude-code-subagents
