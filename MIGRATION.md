# Migrating to SpecFlow 2.0

> For projects set up with SpecFlow 1.x, where skills were rendered into
> `.claude/skills/` and config lived inside the docs directory.

Earlier migrations are covered in
[configuration/MIGRATION.md](configuration/MIGRATION.md).

---

## What changed, and why

| Area | 1.x | 2.0 |
|---|---|---|
| Skills | Rendered per project into `.claude/skills/` | Installed once per machine into `~/.claude/skills/` |
| Project values in skills | Substituted at install time | Read at runtime from config |
| Config location | `docs/.specflow-config.md` | `.specflow/config.md` (fixed) |
| Commands | One per category | A list per category |
| Failure baseline | Not recorded | `## Known Test Failures`, with messages |
| Review gate | Not configured | `codex` / `subagent` / `none` |
| Setup | `specflow init` (CLI) | `specflow-init` (skill, run by an agent) |
| `specflow update` | Overwrote project skills | Updates the machine install only |

Three problems drove this:

1. **A skill improvement had to be reinstalled into every project** before it
   took effect. Now one upgrade reaches every project.
2. **`specflow update` overwrote project skills wholesale**, destroying local
   edits. It no longer touches your projects at all.
3. **Skills could not be shared** from `~/.claude/skills/`, which Claude Code
   loads for every project.

### Why the config had to move

The docs path is itself a config value. A skill installed on the machine cannot
look inside `docs/` to find the file that tells it where `docs/` is. The fixed
anchor at `.specflow/config.md` breaks that circularity: skills know exactly one
path, and that path declares everything else.

---

## How to migrate

```bash
# 1. Install the machine skills
npm install -g specflow-ai@latest && specflow install

# 2. In each project, run the init skill
cd your-project
specflow-init
```

`specflow-init` detects a 1.x project by the absence of a `Config Schema` key
and migrates it. You are asked only about things that cannot be carried forward.

### What it does automatically

Mechanical changes run as code, not improvisation — a key dropped silently here
would fail much later, at the point some skill uses it, with nothing pointing
back to the migration.

- Moves the config to `.specflow/config.md` and deletes the old one.
- Carries every existing value forward.
- Converts single commands into one-item lists.
- Merges the mixed-stack `Tech Commands` shape, if you used it, into the new
  command lists.
- Splits `Ticketing: jira (format: PROJ-123)` into two keys.
- Strips trailing slashes from paths.
- Fills in `Tasks File` and `Session Log` when the usual filenames exist.

### What it asks about

- **Your full command lists.** 1.x recorded one command per category, so a
  monorepo's second test suite was never recorded. This is the moment to add it.
- **A failure baseline**, with each failure's message.
- **A review gate** — it probes for Codex and offers a fallback.
- **Commit convention**, if it was not already recorded.
- **Task and session-log filenames**, if yours are not the defaults.

### What it will not do

- Overwrite a ROADMAP, SESSION_LOG or ADR that has real content.
- Delete anything without listing it first.
- Touch skills in `.claude/skills/` that SpecFlow did not write.

---

## The `.claude/skills/` deletion

`specflow-init` offers to delete the per-project skill copies now superseded by
the machine install. It lists exactly what it will remove first.

**Understand the trade-off before accepting.** These files are usually committed
to your repository. Once deleted, a teammate cloning the repo gets no SpecFlow
skills until they install SpecFlow themselves:

```bash
npm install -g specflow-ai && specflow install
```

If your team is not ready for that, decline. The project then has both
project-level and machine-level copies, one of which shadows the other — work
out which before relying on either.

The deletion is reversible through git.

---

## Verifying the migration

```bash
cat .specflow/config.md
```

Check:

- `Config Schema` is `1`.
- No `<angle bracket>` fill-ins or `UNRESOLVED` markers remain.
- Every `## Commands` list holds **every** command that suite needs — this is
  the single most common thing 1.x got wrong.
- `Default Branch` matches reality.
- Paths under `## Documentation` point at files that exist.

Then run `plan-session`. If the config is wrong, it will say so rather than
guessing.

---

## Rolling back

The migration is a git-visible change to files that were already tracked:

```bash
git checkout -- .specflow docs .claude
git clean -fd .specflow
```

Then pin the old CLI:

```bash
npm install -g specflow-ai@1.3.2
```

1.x skills in `.claude/skills/` are self-contained and keep working, because
their project values were baked in at install time.

---

## Troubleshooting

**"This project has not been initialised for SpecFlow."**
No `.specflow/config.md` was found. Run `specflow-init`. Skills refuse to guess
by design — a skill that invented `docs/ROADMAP.md` would silently write to the
wrong file in a project that uses something else.

**A skill warns that the machine's SpecFlow is stale.**
The project config records a newer schema than the installed skills expect. Run
`specflow update`. Until then skills proceed read-only and change nothing;
lowering the recorded schema would destroy the mismatch signal permanently.

**A skill runs only some of my tests.**
Its command list is incomplete. Add the missing entries to `## Commands` in the
config — that is exactly the failure the list-valued keys exist to prevent.

**`specflow init` says it was removed.**
Correct. Use `specflow install` once per machine, then `specflow-init` in each
project.
