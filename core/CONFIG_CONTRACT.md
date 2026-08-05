# The Config Contract

> The block every SpecFlow skill embeds verbatim. Canonical source — edit here,
> then propagate to all skills that carry it.

Skills are loaded in isolation, so each one carries its own copy rather than
referencing a shared file. Duplication is deliberate: a skill that depends on
another skill's directory being present breaks the moment someone installs a
subset.

---

## The block

Everything between the markers is copied into each skill, unchanged.

<!-- BEGIN CONFIG CONTRACT -->

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
schema this skill expects (stated in the skill's own header):

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

<!-- END CONFIG CONTRACT -->

---

## Which skills carry it

All five machine-installed skills: `specflow-init` (in reduced form — it is the
skill that *creates* the config), `plan-session`, `start-session`,
`end-session`, `plan-autonomous-batch`.

## What the contract replaces

Before schema 1, these facts were substituted into each skill at install time,
which meant a project's skills were a frozen snapshot of its config and a skill
improvement had to be reinstalled everywhere to take effect:

`{{PROJECT_NAME}}`, `{{DOCS_PATH}}`, `{{TEST_COMMAND}}`, `{{LINT_COMMAND}}`,
`{{BUILD_COMMAND}}`, `{{TEST_COMMAND_BINARY}}`, `{{LINT_COMMAND_BINARY}}`,
`{{BUILD_COMMAND_BINARY}}`, `{{DEFAULT_BRANCH}}`, `{{BRANCH_CONVENTION}}`,
`{{COMMIT_CONVENTION}}`, `{{TICKET_FORMAT}}`, `{{TECH_STACK}}`.

These are **not** replaced and stay as placeholders, because they are not
project facts:

| Placeholder | Why it stays |
|---|---|
| `{{FEATURE_NAME}}` | session argument, supplied per invocation |
| `{{TICKET_ID}}` | session argument |
| `{{TASK_TITLE}}` | session argument |
| `{{CURRENT_BRANCH}}` | runtime — read from git every time |
| `{{CURRENT_DATE}}`, `{{DATE}}` | runtime — read from the clock every time |
