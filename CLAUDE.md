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
ai-vibe-framework/
├── cli/                   # NPM package for `npx specflow-ai init/update`
│   ├── src/
│   │   ├── index.js       # CLI entry point
│   │   ├── init.js        # `specflow-ai init` command
│   │   ├── update.js      # `specflow-ai update` command
│   │   ├── config.js      # Shared config utilities (deriveGitVariables)
│   │   ├── detect.js      # Tech stack detection (used by update)
│   │   └── questions.js   # Interactive prompts
│   └── package.json
├── .claude/
│   └── commands/          # Claude Code commands for this repo
│       ├── plan-session.md
│       ├── start-session.md
│       └── end-session.md
├── prompts/
│   └── INIT.md            # Main initialization prompt
├── templates/
│   ├── CLAUDE.md.template # Project context template
│   ├── commands/          # Command templates
│   ├── docs/              # Documentation templates
│   ├── hooks/             # Hook script templates
│   ├── rules/             # Coding rule templates
│   ├── agents/            # Agent templates
│   ├── settings/          # Settings templates (hooks.json, statusline.js)
│   ├── feature_docs/
│   │   └── SPEC.md.template
│   └── gitignore-specflow.template
├── configuration/
│   └── TECH_STACKS.md     # Tech detection reference
├── docs_specflow/         # SpecFlow's own documentation (gitignored)
│   ├── .specflow-config.md
│   ├── ROADMAP.md
│   ├── SESSION_LOG.md
│   ├── ADR.md
│   └── feature_docs/
└── README.md

```

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

SpecFlow has no automated tests. Manual validation checklist:

- [ ] Template syntax is valid Handlebars
- [ ] Variable references match schema in TECH_STACKS.md
- [ ] Markdown renders correctly
- [ ] Examples are realistic and clear
- [ ] Documentation is up to date

---

## Current Focus

See `docs_specflow/ROADMAP.md` for current priorities. Key ongoing work:

1. **CLI Simplification** - CLI scaffolds with placeholders, `/init` detects tech stack and updates command files directly
2. **Documentation audit** - Ensure docs reflect the simplified two-step flow
3. **CUSTOM.md extension** - User-extensible project context file for project-specific customizations

---

## Key Files to Know

- `cli/src/init.js` - CLI `specflow-ai init` command (scaffolds with placeholders)
- `cli/src/update.js` - CLI `specflow-ai update` command (re-renders templates)
- `cli/src/config.js` - Shared utilities (deriveGitVariables)
- `prompts/INIT.md` - AI `/init` command (detects tech stack, populates config)
- `templates/commands/plan-session.md.template` - Core workflow command
- `docs_specflow/ROADMAP.md` - Current tasks (gitignored, not templates)
- `docs_specflow/ADR.md` - Architecture decisions for SpecFlow itself
- `configuration/TECH_STACKS.md` - Tech detection patterns for AI

---

## Questions?

Check `docs_specflow/OVERVIEW.md` for system architecture or `README.md` for user-facing documentation.

For session planning, always start with `/plan-session` to get proper context and task selection.
