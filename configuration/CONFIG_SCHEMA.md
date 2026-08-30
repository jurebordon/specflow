# SpecFlow Config Schema

> Authoritative definition of `.specflow/config.md` — the single file every
> SpecFlow skill reads to learn project facts.

**Current schema version: 1**

---

## The governing rule

Project facts are resolved **once**, by `specflow-init`, and written here. Every
other skill **reads this file and nothing else**. No skill re-detects a stack,
re-derives a test command, or guesses a docs path at runtime.

If this file is absent, a skill states that the project is not initialised and
offers to run `specflow-init`. It does not fall back, half-run, or guess.

---

## Location

`.specflow/config.md`, at the repository root. **This path is fixed and never
configurable.**

It has to be. The documentation path is itself a config value, so a skill
installed to `~/.claude/skills/` cannot look inside `docs/` to find the file
that tells it where `docs/` is. The anchor resolves that circularity: skills
know one path, and that path declares everything else.

Projects predating schema 1 keep their config at `docs/.specflow-config.md` or
`docs_specflow/.specflow-config.md`. Those are schema 0 — see
`migrations/manifest.json`.

---

## Format

Markdown. Scalars are `- **Key**: value`. Lists are sub-bullets under a
heading. The file is read by an agent, not a parser, so readability wins over
machine-strictness — but keep the shape below so the migration manifest can
reason about keys by name.

### Normalisation rules

- **Paths carry no trailing slash.** Write `docs`, not `docs/`. Readers must
  tolerate both; writers must emit the bare form. (Existing projects are
  inconsistent on this — `ecp-sourcing` has `docs`, others have `docs/`.)
- **Commands are always lists**, even when there is one, and each entry runs
  from the repository root. If a command needs a different working directory,
  bake it in: `cd backend && pytest tests/ -q`.
- **Absent optional key** means "not configured", which is distinct from an
  empty value meaning "configured as nothing".

---

## Schema version 1

### `## SpecFlow`

| Key | Type | Required | Notes |
|---|---|---|---|
| `Config Schema` | integer | yes | Gates migration. Bump **only** when the shape below changes. |
| `SpecFlow Version` | semver | yes | Informational: which release wrote this file. Never gate on it. |

Two numbers, because gating on the package version would trigger a migration
check on every npm release including ones that change nothing structural.

`Config Schema` is never lowered. If a skill expects a lower version than the
file records, the machine's SpecFlow is stale — warn, proceed read-only, and
leave the file alone. Writing the lower number would relabel a newer config as
older and destroy the mismatch signal permanently.

### `## Project`

| Key | Type | Required | Source |
|---|---|---|---|
| `Name` | string | yes | interview |
| `Mode` | `greenfield` \| `adoption` \| `constrained` | yes | interview |
| `Description` | string | no | interview |

### `## Tech Stack`

| Key | Type | Required | Source |
|---|---|---|---|
| `Languages` | comma-separated string | yes | detected, confirmed |
| `Frameworks` | comma-separated string | no | detected, confirmed |

Descriptive only. Skills that need to *run* something read `## Commands` — never
infer a command from a language name.

### `## Documentation`

| Key | Type | Required | Source |
|---|---|---|---|
| `Docs Path` | path | yes | interview |
| `Existing Docs` | path | no | interview |
| `Tasks File` | path | yes | derived, confirmed |
| `Session Log` | path | yes | derived, confirmed |
| `Tracking` | `gitignored` \| `tracked` | yes | interview |

`Tasks File` and `Session Log` are stated explicitly rather than implied as
`<docs>/ROADMAP.md` and `<docs>/SESSION_LOG.md`. Projects rename them, and a
skill that assumes the default silently reads the wrong file — or an empty one.

`Tracking` describes the **docs**, not this config file. `.specflow/config.md`
is always git-tracked.

### `## Commands`

Five sub-headings, each a list: `### Test`, `### Lint`, `### Build`,
`### Typecheck`, `### Format`. Any may be empty; omit the entry rather than
recording a placeholder.

Lists, not scalars, because a single value silently loses half a project's
verification. In `crop-rotation-planner` the recorded test command is
`cd backend && pytest tests/` — the frontend suite
(`cd frontend && npm run test`) appears nowhere, so a skill that "runs the
tests" was never running them all.

Detection sources: `package.json` scripts, `pyproject.toml`, `pytest.ini`,
`go.mod`, `Cargo.toml`, `Makefile`. **Always confirm with the user — never
record a detected command silently.**

### `## Known Test Failures`

Baseline so automation can distinguish "already broken" from "I broke it".
One entry per failure:

```markdown
- **Test**: `tests/test_scheduling.py::test_rotation_window`
  - **Message**: `AssertionError: expected 3 windows, got 2`
  - **Reason**: env-dependent, requires TZ=UTC
  - **Recorded**: 2026-08-05
```

`Message` is **required, not decorative.** A skill may only attribute an
observed failure to this baseline after comparing the observed failure message
against the recorded one. Matching on test path alone is forbidden.

This rule exists because it has already failed in practice: two tests broke
from an incomplete rename, in a file listed as known-flaky, and the failures
were waved through on filename alone. The regression reached the branch. A
baseline that is trusted without reading is worse than no baseline, because it
converts a loud failure into a silent one.

Empty is a valid and preferable state. Re-record it at the start of any
autonomous batch rather than trusting an old entry.

### `## Git Workflow`

| Key | Type | Required | Source |
|---|---|---|---|
| `Type` | `solo` \| `team` | yes | interview |
| `Platform` | `GitHub` \| `GitLab` \| `Bitbucket` \| `none` | no | detected from remote |
| `Default Branch` | string | yes | detected, confirmed |
| `Branch Convention` | string | yes | interview |
| `Commit Convention` | string | yes | interview |

`Default Branch` is detected from the git remote's HEAD, not assumed to be
`main`. Skills that guard against running on the default branch read this key —
hardcoding `main`/`master` misses projects using anything else.

### `## Integrations`

Values are lowercase. Schema 0 wrote `None` capitalised and used display
labels like `GitHub Issues`; rules branch on the value being `none`, so the
capital form reads as a configured ticketing system that does not exist.
An unrecognised system is kept verbatim — SpecFlow does not need to know every
tracker by name.

| Key | Type | Required | Source |
|---|---|---|---|
| `Ticketing` | `none` \| `jira` \| `linear` \| `github` \| `gitlab` \| string | yes | interview |
| `Ticket Format` | string | no | interview |

### `## Review Gate`

| Key | Type | Required | Source |
|---|---|---|---|
| `Mode` | `codex` \| `subagent` \| `none` | yes | probe |
| `Probed` | date | yes | probe |
| `Notes` | string | no | probe |

Written by the gate probe, which is a **re-runnable step** — a user who installs
Codex later upgrades their gate without a full re-init.

- `codex` requires all of: the plugin directory
  `~/.claude/plugins/cache/openai-codex/codex/<version>/` containing
  `agents/codex-rescue.md`; the `codex` binary on PATH; and authentication
  (`codex login status`).
- `subagent` is the fallback when Codex is unavailable — a general-purpose
  subagent prompted as an adversarial reviewer under the same `VERDICT:`
  contract, ideally on a different model from the implementer so it is not
  marking its own homework.
- `none` is an explicit opt-out. Skills that gate must then announce loudly,
  once per run, that they are proceeding ungated.

### `## Technical Layers`

| Key | Type | Required |
|---|---|---|
| `Hooks` | `enabled` \| `disabled` | yes |
| `Rules` | `enabled` \| `disabled` | yes |
| `Statusline` | `enabled` \| `disabled` | yes |

---

## What does *not* belong here

- **Session arguments** — `FEATURE_NAME`, `TICKET_ID`, `TASK_TITLE` are supplied
  per invocation.
- **Runtime values** — current branch, current date. Read them from git and the
  clock, every time. A recorded branch name is wrong the moment it is written.
- **Content** — roadmap items, decisions, session history. Those live in the
  docs this file points at.

---

## Reading this file from a hook

Hooks are JavaScript and execute outside the agent, so they parse rather than
read. They need only `Docs Path` and the `Format` command list. Because the
anchor path is fixed, a hook can resolve the config from the repo root with no
configuration of its own — which is why hooks ship verbatim and need no
per-project rendering.

---

## Changing this schema

1. Add a migration entry to `migrations/manifest.json` describing exactly what
   changed: keys added, renamed, removed, files moved, doc-structure changes.
2. Bump `Config Schema` here and in the manifest's `current_schema`.
3. Mark each change `auto` (additive, no user decision) or `decision`
   (needs input, therefore deferrable).

A skill must consult the manifest to decide whether a config needs updating. It
must not judge for itself. Without a manifest entry, "nothing needs updating" is
a guess — and a wrong "all good" leaves a stale config that later skills
misread with no error surfaced. That is the worst failure mode in this design,
because it is invisible.
