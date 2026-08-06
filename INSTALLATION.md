# Installing SpecFlow

SpecFlow installs in two steps: **once per machine**, then **once per project**.

Already on SpecFlow 1.x? See [MIGRATION.md](MIGRATION.md).

---

## Quick Install

```bash
# 1. Once per machine
npm install -g specflow-ai
specflow install

# 2. Once per project
cd your-project
specflow-init

# Start working
plan-session
```

---

## Step 1: `specflow install`

Places five skills into `~/.claude/skills/`:

```
~/.claude/skills/
├── specflow-init/
│   ├── SKILL.md
│   ├── CONFIG_SCHEMA.md          # the schema it writes
│   ├── migrations/               # what changed between schema versions
│   └── payload/                  # hooks, rules, settings, doc skeletons
│       └── ...                   # copied into projects at init
├── plan-session/
├── start-session/
├── end-session/
└── plan-autonomous-batch/
```

Claude Code loads `~/.claude/skills/` for every project, so these are available
everywhere immediately. They ship **verbatim** — no project values are
substituted into them, which is why one upgrade reaches every project at once.

`specflow install` refuses to overwrite a same-named skill it did not install,
so a `plan-session` you wrote yourself is safe. Use `--force` to override, or
`--dry-run` to preview.

A receipt at `~/.claude/skills/.specflow-install.json` records the version,
schema and which directories belong to SpecFlow.

### Options

```bash
specflow install --dry-run    # show what would be written
specflow install --force      # replace same-named skills SpecFlow did not install
specflow --version
```

---

## Step 2: `specflow-init`

Run this **skill** — not a CLI command — inside each project. An agent does the
work, which is the point: it can read your codebase and write real documentation
instead of leaving empty templates behind.

It will:

1. **Interview** you for what cannot be detected — where docs live, whether they
   are gitignored, project mode, branching strategy, commit convention,
   ticketing.
2. **Detect and confirm** the rest — languages, frameworks, test/lint/build/
   typecheck/format commands, default branch, platform. It always shows what it
   found and asks; nothing is recorded silently.
3. **Record a failure baseline** — which tests already fail, and what each
   failure says.
4. **Probe for a review gate** — Codex, a fallback subagent, or none.
5. **Write `.specflow/config.md`** — the one file every skill reads.
6. **Install the payload** — hooks, rules, settings, per your choices.
7. **Scaffold and populate the docs** — with real content, not TODO markers.

Re-running it later is additive. It adds what is missing and never rewrites a
ROADMAP, SESSION_LOG or ADR that has real content.

---

## What Gets Created

```
your-project/
├── .specflow/
│   └── config.md                # every project fact (git-tracked)
├── CLAUDE.md                    # AI context file
├── docs/                        # path is your choice
│   ├── OVERVIEW.md
│   ├── VISION.md
│   ├── ROADMAP.md
│   ├── ADR.md
│   ├── WORKFLOW.md
│   ├── SESSION_LOG.md
│   ├── LEARNED_PATTERNS.md
│   ├── ORCHESTRATION.md
│   ├── AGENTS.md
│   └── CUSTOM.md
└── .claude/
    ├── hooks/                   # if enabled
    ├── rules/                   # if enabled
    ├── settings.json            # merged with yours, not replaced
    └── statusline.cjs            # if enabled
```

No `.claude/skills/` — skills live on your machine.

Hooks and rules are per-project because they are per-project things, but they
ship verbatim and read `.specflow/config.md` at runtime. They cannot drift out
of step with your config, and an upgrade cannot clobber your edits to them.

---

## What Gets Tracked vs Ignored

| Path | Recommendation |
|---|---|
| `.specflow/config.md` | **Track it.** Every skill reads it; a teammate without it has an uninitialised project. |
| `docs/` | Your choice — `specflow-init` asks and records the answer. |
| `.claude/hooks`, `.claude/rules` | Track, so the team shares the same guardrails. |
| `.claude/settings.json` | Track, but expect local additions. |

---

## Updating

```bash
npm install -g specflow-ai@latest
specflow update
```

This updates the machine install. **It does not touch your projects.**

If a release changes the config's shape, the next skill you run in a project
notices, applies the additive parts, and offers anything needing a decision —
without hijacking the task you actually asked for. A check that finds nothing to
do writes nothing, so no spurious diffs appear in your repo.

---

## Sharing with a Team

Commit `.specflow/config.md`, your docs directory, and `.claude/hooks|rules`.
Each teammate then runs, once:

```bash
npm install -g specflow-ai && specflow install
```

Their machine gets the skills; the repo supplies the project facts.

---

## Uninstalling

```bash
# Remove the machine install
rm -rf ~/.claude/skills/{specflow-init,plan-session,start-session,end-session,plan-autonomous-batch}
rm -f ~/.claude/skills/.specflow-install.json
npm uninstall -g specflow-ai

# Remove project files
rm -rf .specflow .claude/hooks .claude/rules .claude/statusline.cjs
# then drop the SpecFlow hook entries from .claude/settings.json
```

Your documentation is yours — deleting it is a separate decision.

---

## Requirements

- Node.js 18+
- git
- An Agent Skills-compatible assistant (Claude Code, Codex CLI, …)

Optional: the Codex CLI plus its Claude Code plugin, which enables the `codex`
review gate for `plan-autonomous-batch`. Without it, that skill falls back to a
subagent reviewer, or runs ungated if you choose.
