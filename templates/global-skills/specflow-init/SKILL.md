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
    ├── hooks/                  ← including specflow-config.cjs
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
| **Both** an anchor and a legacy config | A migration that did not finish, or a hand-made anchor | Step 1, **amend mode** — then finish the migration: carry anything the legacy file still holds that the anchor lacks, and delete the legacy file only once nothing is left in it |

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

Run the migration script rather than transforming the config by hand:

```bash
node <this skill's directory>/payload/migrate-config.js \
  <legacy config path> --repo <repo root>            # proposed schema-1 config
node <this skill's directory>/payload/migrate-config.js \
  <legacy config path> --repo <repo root> --json     # decisions still outstanding
```

It implements every change the manifest marks `auto` — key renames, the
scalar-to-list command transform, the mixed-stack plural shape, the ticketing
split, trailing-slash normalisation — and reports what it could not resolve. It
writes nothing; you review its output and write the file.

Do the mechanical half in code. A key silently dropped during migration fails
much later, at the point some skill uses it, with no error pointing back here.

The script also **refuses to carry prose forward as a command**. Schema 0's
single-value fields invited sentences, and one real project recorded its build
command as "n/a (backend has no build step; frontend build command TBD…)".
Anything like that is dropped and raised as a decision rather than written into
a config that every skill will try to execute.

Then read `migrations/manifest.json` from this skill's directory for the `0 → 1`
entry. It states exactly which keys are carried, renamed, split and added, and
which changes are `auto` versus `decision`.

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

In **migration mode**, the legacy config answers most of these, and re-asking
them is noise. But "carried forward" is not "verified" — a value can be wrong,
and carrying it forward preserves the error rather than the answer. So:

- Carry values forward silently where nothing can check them.
- **Where reality can be checked, check it, and only ask when they disagree.**
  `Tracking` is the one that goes stale: a project marked `gitignored` whose
  docs are in fact committed will carry that lie into schema 1. Run
  `git ls-files <docs path> | head -1` — output means the docs are tracked. Same
  for `Default Branch` against the actual remote HEAD.

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

`migrate-config.js --json` reports `candidates` and raises a `command_lists`
decision listing commands the project has that the config never recorded. Work
through every one: keep it, or say why not. This is mechanical precisely because
leaving it to diligence is how the original bug happened.

Then search existing documentation (README, CONTRIBUTING, WORKFLOW docs) for
command names too. A README usually states the real command, including flags and
prerequisites the manifest does not show — a database that must be up, or a
wrapper script that replaces the bare runner.

**Check that each command does what its key claims.** A real project recorded
`cd frontend && npm run lint --fix` as its formatter; npm gives `--fix` to
itself, not to the script, so it had been formatting nothing for months. A
command that runs successfully is not the same as a command that works.

### Record a failure baseline

Run every detected test command. Any test that fails **now** — before any work
has been done — is a candidate for `## Known Test Failures`.

For each, record the test identifier, **the actual failure message**, a reason,
and today's date. The message is required: skills compare against it before
attributing a later failure to the baseline. Matching on test path alone is
forbidden, because a listed test can still break for a new reason.

If the suite is green, write `- None recorded.`

**If you did not actually run the tests, leave the `UNVERIFIED` line the script
writes.** Do not replace it with `- None recorded.` on the assumption things are
fine. A baseline nobody verified is worse than none: it converts every future
failure into "probably pre-existing".

If the suite cannot run at all (missing dependencies, no database), record that
as a note rather than inventing entries, and say so in the summary.

---

## Step 3: Probe the review gate

This step is **re-runnable** on its own, so a user who installs Codex later can
upgrade their gate without a full re-init.

Probe the **real** machine — the user's actual home directory — not whatever
`HOME` this process happens to have. The gate describes what is installed on
this machine; a sandboxed or overridden `HOME` will find nothing and record
`none`, which is wrong rather than merely cautious.

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

Note the scope mismatch this creates, and do not be surprised by it later: the
gate is a property of **this machine**, recorded in **per-project** config. A
teammate without Codex, or you on another laptop, will read a `codex` gate that
is not there. Skills that gate must therefore re-check availability at run time
and fall back rather than trusting the recorded value. The record says what was
available when the project was set up, not what is available now.

---

## Step 4: Write the config

### First: the anchor must not be gitignored

`migrate-config.js` exits **3** with an `anchor_gitignored` blocker when git
would ignore `.specflow/config.md`. **Do not write the config until that is
resolved.**

1.x's own setup instructions told people to add `.specflow/` to `.gitignore`,
and real projects did — so this is the common case, not the edge case. Ignored,
the anchor is invisible to teammates and CI, every skill on another machine
reports "not initialised" forever, and nothing anywhere explains why.

Show the offending `.gitignore` line, explain the consequence, and ask the user
to remove it. **Do not edit their `.gitignore` yourself without asking** — it is
their file and may be shared. If they decline, stop: an ignored anchor is not a
degraded install, it is a non-functional one.

### Then write it

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
| `payload/settings/statusline.cjs` | `.claude/statusline.cjs` | `Technical Layers > Statusline` is enabled |
| `payload/settings/hooks.json` | merge into `.claude/settings.json` | Hooks enabled |

`.claude/hooks/specflow-config.cjs` is required by every other hook and by the
statusline. Copy it whenever hooks or the statusline are enabled.

**Merge `settings.json`; do not overwrite it.** Users keep their own permissions
and settings there.

If `.claude/settings.json` does not exist, create it from
`payload/settings/hooks.json`. Its absence is common — many projects gitignore
it and commit a `settings.example.json` instead — and is not a reason to skip
wiring the hooks up.

**When it does exist, merge like this:** keep every key the user has that
SpecFlow does not ship (`permissions`, `env`, `model`, anything else) exactly as
it is. Replace `statusLine` wholesale. For `hooks`, replace SpecFlow's own
entries per event and keep any others — match on the command string containing
`.claude/hooks/`, so a hook the user added survives while a stale SpecFlow one
is replaced rather than duplicated.

**Show the merged result before writing it.** This is the one file in the
payload that reliably contains something you did not put there.

In amend mode, refresh payload files that SpecFlow ships. Leave anything else in
those directories untouched — it is the user's.

**Diff before overwriting a shipped file, in every mode.** The "leave anything
else untouched" rule protects files SpecFlow does not ship; it does nothing for
a *shipped* file the user has edited in place. A hand-tuned `.claude/rules/`
file is exactly that, and replacing it without showing the diff destroys work
silently. If a shipped file differs from what this version installs, show the
difference and ask.

### Remove superseded 1.x payload files

A 1.x project has `.js` hooks and a `.js` statusline. The 2.0 payload ships
`.cjs`, so copying it in **leaves both versions side by side** — eight orphaned
hooks and a stale statusline that look installed but are wired to nothing.

After copying, delete the 1.x file wherever SpecFlow shipped a `.cjs`
replacement:

| Remove | When |
|---|---|
| `.claude/hooks/<name>.js` | `.claude/hooks/<name>.cjs` now exists |
| `.claude/statusline.js` | `.claude/statusline.cjs` now exists |

List them before deleting, and delete only names SpecFlow ships. A `.js` hook
the user wrote themselves is theirs — leave it, and say that it may now be
shadowed by a `.cjs` file of the same name.

**Check `.claude/settings.example.json` too.** Projects that gitignore
`settings.json` commit an example instead, and it is the file a teammate copies.
It references the `.js` hooks you just deleted, so after migration the only
git-tracked hook wiring in the repo points at nothing. Update it alongside
`settings.json`, or tell the user it is now stale.

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
- **`<docs>/ORCHESTRATION.md`** — **create it if missing.** `plan-session`,
  `start-session` and `end-session` all read this file. A skeleton ships in
  `payload/doc-templates/`.

  This one is **general by design** — its own text says to keep it stable and
  put volatile project detail in `CUSTOM.md`. Copy it close to verbatim. It is
  the exception to "populate everything", and Step 8's skeleton check does not
  apply to it.
- **`<docs>/WORKFLOW.md`, `AGENTS.md`, `LEARNED_PATTERNS.md`** — create from the
  shipped skeletons when missing, populated the same way as the rest.

Every file in `payload/doc-templates/` should exist in the project when this
step finishes. Check the directory rather than working from this list, so a
template added later is not missed.

---

## Step 7: Legacy cleanup (migration mode only)

Per-project skill copies are superseded by the machine install. **Check every
directory that holds them, not just `.claude/skills/`:**

```bash
ls .claude/skills/ .codex/skills/ 2>/dev/null
```

1.x mirrored its skills into `.codex/skills/` as well, and those copies are
git-tracked too. Deleting only `.claude/skills/` leaves a complete second copy
of the superseded set in the repository — including `init-specflow`, the skill
this one replaces. The migration then reports success with the old world still
sitting there.

1. **List exactly what will be deleted** and show it to the user.
2. **Say which ones do not come back.** Four 1.x skills have no 2.0
   replacement — `explore-project`, `new-worktree`, `pivot-session` and
   `verify`. They were dropped deliberately (Claude Code's own worktree support
   supersedes `new-worktree`), but a user who relies on one is losing a
   capability, not migrating it. That has to be stated before they agree, not
   discovered afterwards.

   The rest map across: `plan-session`, `start-session`, `end-session` and
   `new-feature` keep their names, and `init-specflow` becomes `specflow-init`.
3. Delete only skills SpecFlow ships. Anything else in that directory is
   project-authored — never touch it.
4. **Fix what still points at the deleted skills.** Deleting the files does not
   delete the references, and the project's own docs are full of them. Search
   and update:

   ```bash
   grep -rn "claude/skills\|codex/skills\|/verify\|/pivot-session\|/explore-project\|/new-worktree" \
     CLAUDE.md README.md <docs path>/ 2>/dev/null
   ```

   A `CLAUDE.md` telling the next session to run `/verify` is worse than a
   missing file: the file is absent, so the instruction just fails, and the
   reader has no idea the capability was removed on purpose. Say what replaced
   each one, or that it was dropped.

5. Delete the legacy config once its values are carried into the anchor.

State the consequence plainly: these files are usually git-tracked, so a
teammate cloning the repo will get no skills until they install SpecFlow
themselves. The deletion is reversible through git.

If the user declines, leave everything — but be clear about what declining does
and does not achieve. **Machine-level skills take precedence over project-level
ones** (verified, not assumed). The project's own copies are already inert the
moment SpecFlow is installed on this machine, so keeping them preserves nothing;
it only leaves dead files that look live. Declining is a reasonable choice for
teammates who have not installed SpecFlow yet, and a poor one for anything else.

---

## Step 8: Validate and summarise

Verify before reporting success:

- [ ] `.specflow/config.md` exists, with every required key filled and no
      `<angle bracket>` fill-ins left
- [ ] `Config Schema` is 1
- [ ] Every path in the config resolves to something that exists
- [ ] Every command list has at least one entry, or is deliberately empty
- [ ] Enabled payload files are in place, and `specflow-config.cjs` alongside
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
