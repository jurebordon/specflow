# Orchestration

> SpecFlow's workflow contract for AI-assisted sessions.
> This document defines how work is planned, delegated, checked, and wrapped up.

---

## Purpose

SpecFlow orchestrates the **development session lifecycle**:

1. Choose one task from the roadmap
2. Build enough context to act safely
3. Assign work to the right agent role
4. Verify changes against repo-local commands
5. Persist decisions and next steps

SpecFlow does **not** replace repo-local tooling. Builds, tests, formatters, deploy scripts, review policy, and domain-specific checks belong in `WORKFLOW.md`, `CUSTOM.md`, `.claude/rules/`, or project scripts.

Use this file as the default operating model. Override it only when `CUSTOM.md`, feature specs, or explicit user instructions are more specific.

---

## Session Phases

### 1. Plan

Goal: decide what to do before editing.

Required inputs:
- `ROADMAP.md` - current priorities
- `SESSION_LOG.md` - recent history
- `CUSTOM.md` - project-specific rules and gotchas
- Feature `SPEC.md` when working on a feature branch

Expected output:
- One selected task
- Feature name and branch
- Files likely to change
- Verification commands from `WORKFLOW.md`
- Open questions or blockers

Stop before implementation if requirements, ownership, or risk are unclear.

### 2. Start

Goal: confirm the environment is ready.

Checklist:
- Confirm branch and feature context
- Check working tree status
- Read the approved plan
- Run baseline tests when practical
- Decide whether specialist agents are useful

If baseline tests fail, record that they were failing before the change and either fix them first or ask whether to proceed.

### 3. Implement

Goal: complete the selected task with minimal scope drift.

Rules:
- Keep to one roadmap task unless the user explicitly expands scope
- Read relevant code before editing
- Prefer small, verifiable changes
- Use repo-local conventions over generic advice
- Capture decisions that should appear in `SESSION_LOG.md` or `ADR.md`

### 4. Verify

Goal: prove the result works.

Use `WORKFLOW.md` as the source of truth for commands:
- Tests
- Lint
- Typecheck
- Build
- Manual smoke checks

If verification cannot run, say exactly why in the session summary and `SESSION_LOG.md`.

### 5. Wrap Up

Goal: leave the repo and the next session in a good state.

Required outputs:
- `ROADMAP.md` updated when task status changes
- `SESSION_LOG.md` prepended with summary, files, decisions, blockers, and next step
- `LEARNED_PATTERNS.md` updated when durable project knowledge was discovered
- Commit or PR created according to the configured git workflow

---

## Agent Roles

### Primary Agent

Owns the session. The primary agent selects the task, keeps scope contained, integrates changes, runs verification, and writes the final session record.

### Specialist Agent

Handles a bounded subtask that benefits from focused expertise, such as backend implementation, frontend implementation, database migration, build failure diagnosis, security review, or test coverage review.

Specialists must receive:
- The selected task
- Relevant file paths
- Constraints from `CUSTOM.md`, `WORKFLOW.md`, and feature specs
- Clear write ownership if they may edit files
- Expected output format

### Reviewer Agent

Audits completed work. Reviewer agents should usually be read-only unless explicitly asked to patch issues.

Use reviewers for:
- Security-sensitive changes
- Large refactors
- Missing test coverage
- Architecture or API changes
- Build failures that need independent diagnosis

---

## Delegation Rules

Delegate when:
- Work can run in parallel without blocking the primary agent
- The subtask has clear boundaries and ownership
- A specialist can materially reduce risk or cycle time
- Review would catch meaningful bugs before merge

Do not delegate when:
- The task is simple enough to finish directly
- The next step depends entirely on the delegated answer
- Write ownership would overlap with another active agent
- The agent would need broad, vague context to succeed

For parallel work:
- Assign disjoint files or modules
- Tell agents they are not alone in the codebase
- Require them to avoid reverting other changes
- Integrate and verify from the primary session

For sequential work:
- Finish design or diagnosis first
- Pass concrete findings into implementation
- Run review after implementation, not during conflicting edits

---

## Handoff Prompt Shape

Use this structure when assigning work:

```markdown
Task: [one concrete subtask]

Context:
- Feature: [feature name]
- Branch: [branch]
- Roadmap task: [task text]
- Relevant files: [paths]
- Constraints: [from CUSTOM/WORKFLOW/SPEC]

Ownership:
- You may edit: [paths or modules]
- Do not edit: [paths or modules]

Expected output:
- Summary of changes or findings
- Files changed
- Tests or checks run
- Blockers or risks
```

---

## Checkpoints And Artifacts

| Artifact | Role |
|----------|------|
| `ROADMAP.md` | Task source of truth |
| `SESSION_LOG.md` | Operational history |
| `WORKFLOW.md` | Commands and verification |
| `CUSTOM.md` | Project-specific overrides |
| `LEARNED_PATTERNS.md` | Durable project lessons |
| `ADR.md` | Significant architecture decisions |
| `feature_docs/*/SPEC.md` | Feature requirements and acceptance criteria |
| `AGENTS.md` | Available agents and delegation patterns |

When documents conflict, prefer the most specific current source:

1. Explicit user instruction
2. Feature `SPEC.md`
3. `CUSTOM.md`
4. `WORKFLOW.md`
5. This orchestration contract
6. General SpecFlow defaults

---

## Failure Modes

### Stale Context

Symptoms: branch changed, roadmap no longer matches code, or session log contradicts current state.

Response:
- Re-read `ROADMAP.md`, recent `SESSION_LOG.md`, and relevant feature spec
- Summarize the conflict
- Ask before continuing if the correct direction is unclear

### Failing Baseline

Symptoms: tests fail before implementation.

Response:
- Capture the failing command and key error
- Decide whether the failure blocks the task
- Fix only if it is necessary or obviously related

### Scope Drift

Symptoms: implementation starts pulling in unrelated tasks.

Response:
- Stop and name the extra scope
- Add follow-up tasks to `ROADMAP.md`
- Continue only with the selected task unless user approves expansion

### Overlapping Edits

Symptoms: multiple agents or humans changed the same files.

Response:
- Inspect current diffs before editing
- Preserve changes you did not make
- Integrate carefully instead of reverting

### Unresolved Questions

Symptoms: requirements are ambiguous enough that implementation would be guesswork.

Response:
- Ask the smallest useful question
- Record the blocker in `SESSION_LOG.md` if the session cannot continue

---

## Repo-Specific Overrides

Put project-specific orchestration rules in `CUSTOM.md`, such as:

- Required reviewers or agents for certain files
- Commands that must run before PR creation
- Areas where AI may not edit without approval
- Deployment or release restrictions
- Domain-specific acceptance checks

Keep this file stable and general. Put volatile project details in `CUSTOM.md`.
