---
name: plan-autonomous-batch
description: >-
  Autonomously work through every unchecked task for one feature tag: per task,
  plan -> review gate -> implement -> verify -> review gate -> commit, push,
  update docs, without stopping for approval. Interactive only once, at feature-
  tag selection. Use when a whole tagged batch should be cleared hands-off.
compatibility: Works with Claude Code (requires a subagent-capable host)
metadata:
  author: specflow
  config_schema: 1
---
# Autonomous Batch Session

> Clear every unchecked `[feature: <tag>]` task in the "Now" section through a
> plan → gate → implement → verify → gate → wrap-up cycle per task. Human
> checkpoints are replaced by review gates; the only interaction is picking the
> tag in Step 0.

**Expected config schema: 1**

**Never enter plan mode. Never wait for approval after Step 0.** If something
needs a decision the task's entry does not cover, skip that task with a note and
continue the batch.

---

## Reading project config

Before doing anything else, read `.specflow/config.md` from the repository root.
This is the only place project facts come from. Do not detect a stack, derive a
test command, or infer a docs path — all of it is in that file.

**If the file does not exist**, stop and say:

> This project has not been initialised for SpecFlow. Run `specflow-init` to set
> it up.

Do not guess, do not half-run, and do not fall back to defaults.

**If it exists**, compare `SpecFlow > Config Schema` against the schema this
skill expects (stated above):

| Situation | What to do |
|---|---|
| The file's schema is **lower** | Migration is needed. Apply only manifest changes marked `auto`, mention `decision` items as deferrable, then continue. |
| The schemas are **equal** | Proceed. Write nothing to the config. |
| The file's schema is **higher** | This machine's SpecFlow is stale. Warn, proceed read-only, change nothing. |

Never lower `Config Schema`. A no-op writes nothing. Never let a migration
hijack the run — this skill is long and unattended; a setup interview in the
middle of it defeats the point.

Everything this skill needs comes from the config:

| Need | Config key |
|---|---|
| Task source | `Documentation > Tasks File` |
| Session journal | `Documentation > Session Log` |
| Verification | `## Commands` → `### Test`, `### Lint`, `### Build`, `### Typecheck` |
| Failure baseline | `## Known Test Failures` |
| Branch guard | `Git Workflow > Default Branch` |
| Commit format | `Git Workflow > Commit Convention` |
| Gate | `Review Gate > Mode` |

---

## Step 0: Preflight and tag selection (the only interactive step)

1. **Branch guard.** `git branch --show-current`. If it equals
   `Git Workflow > Default Branch`, **stop** — tell the user to create a feature
   branch or worktree. Never run this skill on the default branch.

   Compare against the config value. Do not test for `main` or `master`: a
   project on `trunk` or `develop` would sail straight through a hardcoded check
   and get an unattended batch committed to its mainline.

2. **Clean tree.** `git status --short`. If there are uncommitted changes, ask
   (fold this into the tag question below) whether to abort or continue. Batch
   commits must contain only batch work.

3. **Gate readiness.** Read `Review Gate > Mode` and prepare accordingly —
   see *Review gates* below. If the configured gate cannot be reached, **stop**
   and tell the user. Running ungated when the config says otherwise defeats the
   purpose of the skill.

   The exception is `Mode: none`, where the user has opted out. Then state
   loudly, once, that this run is proceeding ungated — and continue.

4. **Scan the tasks file.** Parse its "Now" section and list every feature tag
   with unchecked `- [ ]` tasks, with counts.

5. **Ask which tag to tackle.** One question, options drawn from step 4. This is
   the last interaction.

6. **Record the failure baseline.** Run **every** command under `### Test`, and
   note pre-existing warnings from `### Lint`.

   Record what each failure **says**, not just which test failed. `## Known Test
   Failures` names candidates; it does not excuse them. Every later comparison
   is against messages captured here.

7. **Print the watchdog line.** If the host provides a `/goal` command, print
   this for the user to paste, then continue immediately without waiting. If it
   does not, skip this step — it is a convenience, not a dependency.

   ```
   /goal Every task tagged [feature: {TAG}] in the "Now" section of {TASKS_FILE} is either checked [x] or explicitly annotated "SKIPPED:"/"NEEDS-REVIEW:" with a reason. For each completed task the conversation shows: a plan verdict line, a diff verdict line, verification output with no failures beyond the {N_BASE} baseline failures recorded at batch start, and a commit pushed to branch {BRANCH}. {DEFAULT_BRANCH} is never checked out or merged to. Stop after 80 turns even if incomplete and summarize remaining work.
   ```

---

## Review gates

A gate takes a payload, returns a verdict, and never edits files. The contract
is identical across modes:

> Reply with a first line of exactly `VERDICT: APPROVED` or `VERDICT: REVISE`,
> followed by your reasons. REVISE only for concrete defects — wrong approach, a
> missed case, a missing test. Style preferences are comments, not blockers.

**Every gate request must be explicitly read-only:** "review only, do not edit
files."

| `Review Gate > Mode` | How to run it |
|---|---|
| `codex` | Delegate to the Codex reviewer agent (`codex:codex-rescue`), foreground. |
| `subagent` | Spawn a general-purpose subagent prompted as an adversarial reviewer. Use a different model from the implementer where the host allows it — a reviewer marking its own homework is not a gate. |
| `none` | No gate. Skip the gate steps; the ungated warning from Step 0 stands. |

**If a gate returns nothing or errors, retry once. If it fails again, stop the
batch and report.** Never proceed silently ungated — a batch that quietly
degrades into unreviewed commits is worse than one that halts.

### Budget for gates, not for coding

Gates dominate wall-clock: roughly 2–5 minutes per round trip, and a real
10-task batch made about 16 gate calls with one hanging for 17 minutes. Expect
the run to be gate-bound. Do not interpret a slow gate as a failed one before
the retry.

---

## Step 1: Per-task cycle

Work top to bottom through unchecked `[feature: {TAG}]` tasks in "Now". For
each:

### 1.1 Plan

Read the task's entry — it is the pre-approved scope — plus the last 2–3 session
log entries and the referenced code. Draft a plan inline using the structure
from `plan-session` → *Plan structure* (Steps / Files to Modify / Tests to Add /
Success Criteria). Keep it scoped to this one task.

### 1.2 Plan gate

Send the task entry and the full plan through the gate.

- **APPROVED** → record the verdict line in the conversation, proceed.
- **REVISE** → revise per the reasons and resubmit. **Maximum 2 rounds.** Still
  REVISE after that → annotate the task
  `(SKIPPED: gate rejected plan twice — <one-line reason>)`, do not implement,
  move to the next task.

### 1.3 Implement

Implement per the approved plan. Follow `.claude/rules/`. Add or update the
tests named in the plan. Touch only files related to this task — no drive-by
refactors.

When the change renames a symbol, string or file, sweep for every occurrence
**case-insensitively**, including test files and fixtures. A case-sensitive
sweep once missed two test files, and the breakage reached the branch looking
like existing flakiness.

### 1.4 Verify

Run **every** command under `### Test`, `### Lint`, `### Build` and
`### Typecheck`. All entries in each list — a project with two suites needs both.

Show the output. For each failure, **read the message** and compare it against
the baseline from Step 0 and against `## Known Test Failures`.

**A test appearing in the known-failures list is not sufficient.** If the
message differs from the recorded one, it is a new failure wearing a familiar
name. This exact case has bitten a real batch: an incomplete rename broke two
tests in a known-flaky file, the failures were attributed to flakiness without
being read, and the regression reached the branch.

Fix every new failure before the diff gate.

### 1.5 Diff gate

Send `git diff` plus the list of untracked new files, with the task context,
through the gate. Ask specifically about correctness against the task,
regressions, missed edge cases and test adequacy.

- **APPROVED** → proceed.
- **REVISE** with blocking findings → fix, re-run 1.4, resubmit. **Maximum 2
  rounds.** Still REVISE after that → **commit anyway** (the work is
  verification-green) but leave the task **unchecked**, annotate it
  `(NEEDS-REVIEW: <outstanding finding>)`, and list the findings in the session
  log entry. Continue with the next task.

### 1.6 Wrap up the task

Follow `end-session` but **skip its merge step** — `end-session` → *Merge or
open a PR* — entirely. The merge decision belongs to the user, after review.

1. Update the tasks file: check the box, or annotate per 1.2 / 1.5.
2. Prepend a session log entry in the `end-session` → *Session log entry*
   format, heading `## [{TAG}] YYYY-MM-DD — <task short name> (autonomous)`.
   Include both verdict lines and any unresolved findings.
3. **Confirm both doc edits landed. If either failed, do not commit** — stop and
   report. A commit carrying code without its documentation makes the task look
   done while leaving no record of it; a doc script once aborted while its
   commit ran anyway, producing exactly that.
4. Commit everything for this task as **one commit**, following
   `Git Workflow > Commit Convention`.
5. `git push origin <current branch>` (`-u` on first push).
6. **Never** check out the default branch, merge, or delete the branch.

Then loop to the next unchecked task.

---

## Step 2: Batch completion

1. Final full verification across every configured command list, output shown.
2. Confirm every `[feature: {TAG}]` task in "Now" is `[x]`, `SKIPPED:` or
   `NEEDS-REVIEW:`.
3. Summary table: task → outcome (done / skipped / needs-review), commit hash,
   both verdicts.
4. Remind the user to review the commit series and decide on merging. **The
   batch never merges.**

---

## Guardrails

- One commit per task. No drive-by refactors.
- Frozen docs rules apply: do not touch VISION.md or SPEC requirement sections.
- Baseline failures are not yours to fix unless a task says so — but a **new**
  failure always blocks the current task's commit.
- If two consecutive tasks are skipped, pause and say so loudly in the summary
  line. The batch definition may be stale.
- Without a watchdog bounding the run, still respect an ~80-turn budget.
- If the config's baseline turns out to be wrong, report it at the end. Do not
  rewrite the config mid-batch.
