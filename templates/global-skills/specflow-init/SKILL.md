---
name: specflow-init
description: >-
  Initialise or upgrade SpecFlow in a project. Interviews for what cannot be
  detected, detects and confirms what can be, probes for a review gate, writes
  .specflow/config.md, installs hooks and rules, and scaffolds AND populates the
  documentation. Also migrates projects from the pre-anchor layout. Re-running is
  additive and never destroys written content.
compatibility: Works with Claude Code, Codex CLI, and other Agent Skills-compatible tools
metadata:
  author: specflow
  config_schema: 1
---
# SpecFlow Init

> Resolve every project fact once, write it down, and populate the docs.

**Writes config schema: 1**

This is the only skill that creates or modifies `.specflow/config.md`. Every
other skill reads it. If you find yourself detecting a stack inside another
skill, that logic belongs here.

---

## Files this skill ships with

The installer places these **inside this skill's own directory**, so they are
present wherever the skill is. Resolve them relative to this `SKILL.md`, not to
the project and not to a SpecFlow source checkout:

```
<this skill's directory>/
├── SKILL.md                    ← you are here
├── CONFIG_SCHEMA.md            ← the schema this skill writes
├── migrations/manifest.json    ← what changed between schema versions
└── payload/
    ├── hooks/                  ← including specflow-config.js
    ├── rules/
    └── settings/
```

**If any of them is missing, stop and report it.** A truncated install cannot
migrate correctly: without the manifest there is no way to prove a config is
current, and guessing produces a stale config that later skills misread with no
error surfaced.

---

## Step 0: Determine the situation

```bash
git rev-parse --show-toplevel     # repo root — everything below is relative to it
ls .specflow/config.md 2>/dev/null
ls docs/.specflow-config.md docs_specflow/.specflow-config.md 2>/dev/null
ls .claude/skills/ 2>/dev/null
```

| Found | Situation | Go to |
|---|---|---|
| `.specflow/config.md` | Already initialised | Step 1, **amend mode** |
| Only a legacy config in a docs directory | Pre-anchor project | Step 1, **migration mode** |
| Neither | Fresh project | Step 1, **fresh mode** |

If not inside a git repository, say so and stop. SpecFlow's workflow is built on
branches; there is nothing sensible to configure without one.

### Amend mode is additive

On an already-initialised project this skill **amends**. It creates missing
docs, adds missing config keys, refreshes the payload, and records the version.

**It never rewrites populated content.** A tasks file with real tasks, a session
log with real history, an ADR with real decisions — these are the project's
memory. Leave them alone.

Show a diff preview of every intended change and get confirmation before
writing.

### Migration mode

Read `migrations/manifest.json` from this skill's directory and follow the
`0 → 1` entry. It states exactly which keys are carried, renamed,
split and added, and which changes are `auto` versus `decision`.

Consult the manifest rather than judging for yourself. Deciding "nothing needs
updating" without it is a guess, and a wrong "all good" leaves a stale config
that later skills misread with no error surfaced — the worst failure mode here,
because it is invisible.

Carry every value forward. Do not re-interview for something the legacy config
already answers.

---

## Step 1: Interview — what cannot be detected

Ask these. Do not guess them, and do not accept a detected value in their place.

1. **Where should documentation live?** Offer any existing docs directory you
   found. Default `docs`.
2. **Are the docs gitignored or tracked?**
3. **Project mode** — `greenfield` (new, building from a spec), `adoption`
   (existing codebase), or `constrained` (mandated or forbidden technologies).
4. **Branching strategy** — solo or team, and the branch naming convention.
5. **Commit convention.**
6. **Ticketing** — none, or which system and what the ticket format looks like.

In **amend mode**, ask only for keys that are missing. Do not re-ask what the
config already records.

Batch these into as few questions as possible. This is the only interactive part
of initialisation; everything after it is detection and confirmation.

---

## Step 2: Detect and confirm

Detect from these sources, then **show what you found and ask the user to
confirm or correct it**. Never record a detected value silently.

| What | Where to look |
|---|---|
| Languages, frameworks | `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `Gemfile`, `pom.xml`, `dbt_project.yml` |
| Test / lint / build / typecheck / format commands | `package.json` scripts, `pyproject.toml`, `pytest.ini`, `tox.ini`, `Makefile`, CI workflow files |
| Default branch | `git symbolic-ref refs/remotes/origin/HEAD`, falling back to the current branch |
| Platform | the git remote URL |

### Commands are lists — find all of them

**A monorepo has more than one test command.** Walk every subproject with its
own manifest, not just the repository root.

This matters concretely: an existing project recorded
`cd backend && pytest tests/` as its single test command, and its frontend suite
appeared nowhere. Every skill that "ran the tests" ran half of them, for months,
silently.

Each command must run from the repository root — bake in the directory change:
`cd frontend && npm run test`.

Search existing documentation (README, CONTRIBUTING, WORKFLOW docs) for command
names before falling back to file-pattern detection. A README usually states the
real command, including flags the manifest does not show.

### Record a failure baseline

Run every detected test command. Any test that fails **now** — before any work
has been done — is a candidate for `## Known Test Failures`.

For each, record the test identifier, **the actual failure message**, a reason,
and today's date. The message is required: skills compare against it before
attributing a later failure to the baseline. Matching on test path alone is
forbidden, because a listed test can still break for a new reason.

If the suite is green, write `- None recorded.` An empty baseline is valid and
safer than a guessed one.

If the suite cannot run at all (missing dependencies, no database), record that
as a note rather than inventing entries, and say so in the summary.

---

## Step 3: Probe the review gate

This step is **re-runnable** on its own, so a user who installs Codex later can
upgrade their gate without a full re-init.

Probe for `codex`, which requires **all** of:

```bash
ls ~/.claude/plugins/cache/openai-codex/codex/*/agents/codex-rescue.md
command -v codex && codex --version
codex login status
```

- All three present → `Mode: codex`
- Otherwise, offer `subagent` — a general-purpose subagent prompted as an
  adversarial reviewer under the same `VERDICT:` contract, ideally on a
  different model from the implementer so it is not marking its own homework.
- If the user opts out → `Mode: none`, and tell them gated skills will announce
  once per run that they are proceeding ungated.

Record `Mode`, `Probed` (today's date) and any `Notes`.

---

## Step 4: Write the config

Write `.specflow/config.md` from the schema in this skill's `CONFIG_SCHEMA.md`.
Fill every required key. Paths carry no trailing slash.

**In amend mode, write only if something actually changed.** The config is
git-tracked, so rewriting it to restamp a version produces a commit-worthy diff
on every machine after every release, and a merge conflict on shared repos. If
the only pending change is a version bump, leave it — `end-session` commits docs
anyway and it can ride along.

Never lower `Config Schema`.

---

## Step 5: Install the payload

Copy from this skill's `payload/` directory (see *Files this skill ships with*)
into the project. These files ship
verbatim and read `.specflow/config.md` at runtime, so there is nothing to
render and nothing that can go stale:

| From | To | When |
|---|---|---|
| `payload/hooks/*` | `.claude/hooks/` | `Technical Layers > Hooks` is enabled |
| `payload/rules/*` | `.claude/rules/` | `Technical Layers > Rules` is enabled |
| `payload/settings/statusline.js` | `.claude/statusline.js` | `Technical Layers > Statusline` is enabled |
| `payload/settings/hooks.json` | merge into `.claude/settings.json` | Hooks enabled |

`.claude/hooks/specflow-config.js` is required by every other hook and by the
statusline. Copy it whenever hooks or the statusline are enabled.

**Merge `settings.json`; do not overwrite it.** Users keep their own permissions
and settings there.

In amend mode, refresh payload files that SpecFlow ships. Leave anything else in
those directories untouched — it is the user's.

---

## Step 6: Scaffold and populate the docs

Create any missing document, then **fill it with real content**. For an existing
codebase this means reading the code, not leaving a skeleton behind. A doc set
full of TODO markers is worse than none: it looks initialised and teaches the
next session nothing.

**Never overwrite a document that already has real content.**

### Gather context first

**Adoption mode** — read existing documentation (README, CONTRIBUTING,
architecture and API docs, any ADRs), then scan the codebase:

```bash
find . -maxdepth 3 -type d -not -path '*/.*' -not -path '*/node_modules/*' \
  -not -path '*/venv/*' -not -path '*/__pycache__/*' -not -path '*/target/*' | head -60
```

Identify code organisation and naming conventions, module structure, test
patterns and locations, key entities and models, API surface, and the main
dependencies and their roles.

**Greenfield mode** — ask for a PRD or tech spec and extract the product
description, problem statement, target users, core user journeys, architectural
decisions and success metrics.

**Constrained mode** — as greenfield, plus ask what is mandated and what is
forbidden, and record those constraints in the ADR.

### What each document gets

Resolve `<docs>` from `Documentation > Docs Path`.

- **`<docs>/OVERVIEW.md`** — 2–3 sentence product description; 2–4 concrete user
  journeys with IDs; architecture (stack, directory tree, main modules, data
  layer and key entities, integrations); external contracts (API specs, events,
  schemas) where they exist; 3–5 invariants that must always hold.
- **`<docs>/VISION.md`** — problem statement, solution hypothesis, target users,
  qualitative success metrics, non-goals, confirmed stack. **Do not invent
  numeric targets.** This file is frozen after creation and a hook blocks later
  edits, so get it right now.
- **The tasks file** — current phase; 1–3 tasks under "Now"; 2–3 under "Next";
  2–3 under "Later". **Every task carries a `[feature: name]` tag** — untagged
  tasks are invisible to every filtering skill. For adoption, focus the first
  tasks on understanding and documenting what exists.
- **`<docs>/ADR.md`** — fill ADR-0001 with the actual stack (backend, frontend,
  database, infrastructure) and the specific consequences of those choices.
- **The session log** — create with a header and one initialisation entry.
- **`CLAUDE.md`** at the repo root — key patterns discovered, invariants copied
  from OVERVIEW, and an accurate git workflow section. Leave other sections
  alone if the file exists.
- **`<docs>/CUSTOM.md`** — external references, project-specific commands,
  conventions, known gotchas. **Only populate what you actually found.** An
  invented convention is worse than an empty section.
- **`<docs>/feature_docs/`** — create the directory. Add a SPEC only when a
  feature is already well defined.

---

## Step 7: Legacy cleanup (migration mode only)

Per-project skill copies under `.claude/skills/` are superseded by the machine
install.

1. **List exactly what will be deleted** and show it to the user.
2. Delete only skills SpecFlow ships. Anything else in that directory is
   project-authored — never touch it.
3. Delete the legacy config once its values are carried into the anchor.

State the consequence plainly: these files are usually git-tracked, so a
teammate cloning the repo will get no skills until they install SpecFlow
themselves. The deletion is reversible through git.

If the user declines, leave everything and note that the project now has both
project-level and machine-level copies, which may shadow each other.

---

## Step 8: Validate and summarise

Verify before reporting success:

- [ ] `.specflow/config.md` exists, with every required key filled and no
      `<angle bracket>` fill-ins left
- [ ] `Config Schema` is 1
- [ ] Every path in the config resolves to something that exists
- [ ] Every command list has at least one entry, or is deliberately empty
- [ ] Enabled payload files are in place, and `specflow-config.js` alongside
      them
- [ ] No document was left as a skeleton
- [ ] The tasks file has tagged tasks

Then summarise: what was written, what was detected versus confirmed, the review
gate, the failure baseline, and anything deferred.

**Report honestly.** If the test suite could not run, if a doc was left thin
because the codebase was unclear, or if the user deferred a decision, say so.
A summary that claims completeness the work does not have is the same failure as
a stale config: it looks fine and is wrong.

---

## Notes

- Everything in Step 1 is a question; everything in Step 2 is a confirmation.
  Keep that boundary — silently recorded detection is how wrong commands end up
  in a config nobody re-reads.
- Re-running this skill is safe by design. If it ever is not, that is a bug.
- This skill does not commit. The user decides when to commit initialisation.
