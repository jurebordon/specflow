# SpecFlow Development Guide

> Context for AI assistants working on the SpecFlow framework

---

## Project Overview

**SpecFlow** is a lightweight, spec-driven framework for AI-assisted software development. It provides a structured approach to documentation and session-based workflows that helps developers maintain context across AI-assisted coding sessions.

**Mode**: Adoption (improving an existing framework)
**Tech Stack**: Markdown templates with Handlebars variables
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

### 2. Template System
- Handlebars syntax: `{{VARIABLE}}`, `{{#if CONDITION}}`, `{{#each ARRAY}}`
- Variables defined in `.specflow-config.md` or detected automatically
- Tech-adaptive commands (TEST_COMMAND, BUILD_COMMAND, LINT_COMMAND)

### 3. Three-Layer Documentation
- **Strategic**: VISION.md, ADR.md (rarely changes)
- **Tactical**: OVERVIEW.md, ROADMAP.md, WORKFLOW.md (evolves with project)
- **Operational**: SESSION_LOG.md (append-only journal)

### 4. Session-Based Workflow
```
/plan-session   → Read context, filter tasks, create plan
/start-session  → Verify environment, begin implementation
/end-session    → Test, document, commit, merge/PR
/verify         → Validate docs consistency and project health
```

---

## Development Guidelines

### When Working on Templates
1. **Read existing templates** to understand patterns
2. **Test with sample variables** to ensure correct rendering
3. **Keep instructions concise** - AI agents should move fast
4. **Use consistent formatting** - Markdown with clear headings
5. **Document variables** in comments or examples

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
