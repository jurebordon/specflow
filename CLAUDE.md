# SpecFlow Development Guide

> Context for AI assistants working on the SpecFlow framework

---

## Project Overview

**SpecFlow** is a lightweight, spec-driven framework for AI-assisted software development. It provides a structured approach to documentation and session-based workflows that helps developers maintain context across AI-assisted coding sessions.

**Mode**: Adoption (improving an existing framework)
**Tech Stack**: Markdown skills + a small Node CLI. No templating engine.
**Repository**: https://github.com/jurebordon/specflow

---

## Architecture

### Directory Structure

```
specflow/
├── cli/                        # NPM package — a machine installer, nothing more
│   ├── bin/specflow.js         # CLI entry point (install / update)
│   ├── src/install.js          # the only command; places skills in ~/.claude/skills/
│   ├── scripts/bundle-templates.js  # copies templates+configuration into the package
│   └── package.json
├── templates/
│   ├── global-skills/          # The five machine-installed skills. Ship VERBATIM.
│   │   ├── specflow-init/SKILL.md
│   │   ├── plan-session/SKILL.md
│   │   ├── start-session/SKILL.md
│   │   ├── end-session/SKILL.md
│   │   └── plan-autonomous-batch/SKILL.md
│   ├── payload/                # Installed INTO projects by specflow-init. Verbatim.
│   │   ├── hooks/              #   incl. specflow-config.js, the shared config reader
│   │   ├── rules/              #   reference the config; never bake values in
│   │   ├── settings/
│   │   ├── doc-templates/      #   skeletons the agent fills with real content
│   │   └── migrate-config.js   #   deterministic schema 0 -> 1 transform
│   ├── specflow/config.md.template
│   ├── CLAUDE.md.template
│   └── feature_docs/SPEC.md.template
├── configuration/
│   ├── CONFIG_SCHEMA.md        # authoritative schema for .specflow/config.md
│   ├── migrations/manifest.json # machine-readable, gates migration
│   └── TECH_STACKS.md
├── core/
│   ├── CONFIG_CONTRACT.md      # the block every global skill embeds
│   └── PRINCIPLES.md, DOCUMENTATION.md, SESSIONS.md
├── prompts/INIT.md             # superseded; kept as the schema 0 shape reference
├── MIGRATION.md                # 1.x -> 2.0 upgrade guide
└── README.md
```

**`docs_specflow/`** holds SpecFlow's own operational docs and is gitignored, so
it will not be present in a fresh clone.

---

## Key Concepts

### 1. Feature-Tagged Central Documentation
- All tasks tagged with `[feature: name]` in single ROADMAP.md
- All sessions tagged with `[feature-name] YYYY-MM-DD` in single SESSION_LOG.md
- Use `[feature: infrastructure]` for project-wide work
- Automatic feature detection from branch names

### 2. No Build-Time Substitution

Handlebars templating is **gone** from everything that ships. Skills and payload
files are copied byte-for-byte and resolve project facts at runtime from
`.specflow/config.md`.

The only remaining `{{...}}` in `templates/global-skills/` are prompt-level
markers the agent fills per invocation — `{{FEATURE_NAME}}`, `{{TICKET_ID}}`,
`{{TASK_TITLE}}` — and runtime values it reads fresh each time,
`{{CURRENT_BRANCH}}` and `{{CURRENT_DATE}}`. Anything else is a bug.

`templates/payload/` must contain no `{{` at all.

### 3. Two Version Numbers

- `specflow_version` moves with every release. Informational only.
- `config_schema` moves only when the config's **shape** changes, and is what
  gates migration. Gating on the package version would trigger a migration
  check on releases that changed nothing structural.

### 4. Three-Layer Documentation
- **Strategic**: VISION.md, ADR.md (rarely changes)
- **Tactical**: OVERVIEW.md, ROADMAP.md, WORKFLOW.md (evolves with project)
- **Operational**: SESSION_LOG.md (append-only journal)

### 5. Session-Based Workflow

The five machine-installed skills:

```
specflow-init          → Set up or migrate a project; the only writer of config
plan-session           → Read context, filter tasks, create plan
start-session          → Verify environment, record baseline, implement
end-session            → Verify, document, commit, merge/PR
plan-autonomous-batch  → Clear a whole feature tag hands-off, through review gates
```

`explore-project`, `new-feature`, `new-worktree`, `pivot-session` and `verify`
are **not** part of the 2.0 set. They were per-project skills in 1.x and have
not yet been converted to the config-driven model.

---

## Development Guidelines

### When Working on Skills
1. **Read the existing skills** — they share a deliberate structure
2. **Never reintroduce a project value.** If a skill needs a fact, add it to
   `configuration/CONFIG_SCHEMA.md` and have the skill read it
3. **Update `core/CONFIG_CONTRACT.md` first**, then propagate the block to every
   skill that carries it — it is duplicated on purpose, so it drifts easily
4. **Reference other skills by named anchor**, never by step number; step
   numbers rot the moment either skill is edited
5. **Keep instructions concise** — agents should move fast

### When Changing the Config Shape
1. Update `configuration/CONFIG_SCHEMA.md`
2. Add a migration entry to `configuration/migrations/manifest.json`, marking
   each change `auto` or `decision`
3. Bump `config_schema` in the schema doc, the manifest, `cli/src/install.js`
   and every skill's frontmatter
4. Teach `templates/payload/migrate-config.js` the transform
5. Verify against copies of real legacy configs — never the originals

### When Working on Prompts
1. **Be directive** - Tell AI what to do, not just what to consider
2. **Structure with steps** - Numbered steps for clarity
3. **Include examples** - Show expected output format
4. **Handle edge cases** - What if file doesn't exist? What if no feature detected?

### When Working on Documentation
1. **Use feature tags** - Every task needs `[feature: name]`
2. **Keep ROADMAP current** - Move completed items to Done
3. **Log sessions** - Prepend new entries to SESSION_LOG
4. **Update ADR for big decisions** - Architecture changes need documentation

### Git Workflow
- **Branch naming**: `feat/description`, `fix/description`, `refactor/description`
- **Commit convention**: `feat|fix|refactor|docs: clear description`
- **Push frequently**: Keep GitHub in sync
- **Use PRs for major features**: Solo workflow for small fixes

---

## Common Commands

### Development Session
```bash
# Plan next task
/plan-session

# Start implementation (after plan approval)
/start-session

# Wrap up and commit
/end-session
```

### Git Operations
```bash
# Create feature branch
git checkout -b feat/description

# Commit with co-author
git commit -m "feat: description

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push to GitHub
git push origin main
```

---

## Testing & Validation

SpecFlow has no test framework. Validate by exercising the real paths:

```bash
# Installer, without touching your real ~/.claude
HOME=$(mktemp -d) node cli/bin/specflow.js install

# Migration, against a COPY of a real project's legacy config
node templates/payload/migrate-config.js <copy>/docs/.specflow-config.md --repo <copy> --json

# Hooks, by piping the JSON payload Claude Code would send
echo '{"cwd":"<fixture>","tool_input":{"file_path":"..."}}' | node templates/payload/hooks/doc-file-blocker.js
```

Checklist:

- [ ] `templates/global-skills/` contains **no** project-config placeholders.
      Only `{{FEATURE_NAME}}`, `{{TICKET_ID}}`, `{{TASK_TITLE}}` (session
      arguments) and `{{CURRENT_BRANCH}}`, `{{CURRENT_DATE}}` (runtime).
- [ ] `templates/payload/` contains no Handlebars at all — it ships verbatim.
- [ ] `configuration/migrations/manifest.json` parses, and every `decision`
      referenced by an added key exists in `decisions`.
- [ ] The manifest still covers every key in real legacy configs.
- [ ] Hook functions are total — a malformed config must never break a session.
- [ ] Consumer projects are treated as **read only**. Copy to `/tmp` to test.

---

## Invariants

Break these and the design stops holding:

1. **One source of project facts.** Skills read `.specflow/config.md` and
   nothing else. If a skill re-detects something, that logic belongs in
   `specflow-init`.
2. **Skills ship verbatim.** No build-time substitution. A value baked into a
   skill is a value that goes stale in every project that installed it.
3. **Never lower `Config Schema`.** It destroys the mismatch signal permanently.
4. **A no-op writes nothing.** The config is git-tracked; restamping it produces
   churn and merge conflicts on shared repos.
5. **Commands are lists.** Every entry, every time. This is the bug the whole
   schema change exists to fix.
6. **Known-failure attribution requires reading the message.** Matching on test
   path alone has already let a real regression through.

---

## Key Files to Know

- `cli/src/install.js` — the entire CLI: places skills, records a receipt
- `templates/global-skills/specflow-init/SKILL.md` — owns all project facts
- `templates/global-skills/plan-autonomous-batch/SKILL.md` — gated batch runner
- `core/CONFIG_CONTRACT.md` — canonical block embedded in every global skill;
  edit here, then propagate
- `configuration/CONFIG_SCHEMA.md` — authoritative config schema
- `configuration/migrations/manifest.json` — gates migration; update it whenever
  the schema shape changes
- `templates/payload/hooks/specflow-config.js` — the reader hooks parse with
- `templates/payload/migrate-config.js` — deterministic 0 → 1 transform

---

## Questions?

`README.md` for the user-facing story, `MIGRATION.md` for the 1.x upgrade path,
`configuration/CONFIG_SCHEMA.md` for what a config may contain.

For session planning, start with `plan-session`.
