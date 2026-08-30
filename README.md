# SpecFlow

**From idea to implementation with AI guardrails.**

SpecFlow is a lightweight, spec-driven framework for AI-assisted software development. It provides structure and guardrails for working with AI coding assistants (Claude, Cursor, Copilot, etc.) without the chaos of unguided "vibe coding."

## Why SpecFlow?

AI coding assistants are powerful but undirected. Without structure, you get:
- Documentation drift (code and docs diverge)
- Context loss between sessions
- Inconsistent patterns across the codebase
- No clear record of decisions made

SpecFlow solves this with:
- **Three-layer documentation** (strategic → tactical → operational)
- **Feature-tagged tasks** (every task belongs to a feature)
- **Session-based workflow** (plan → implement → wrap up)
- **One config, read at runtime** (project facts live in one file every skill reads)
- **Automatic feature detection** (from branch names, zero configuration)

## Quick Start

Two steps: install once per machine, initialise once per project.

```bash
# 1. Once per machine — installs skills into ~/.claude/skills/
npm install -g specflow-ai && specflow install

# 2. Once per project — run this skill inside your repo
specflow-init

# Start working
plan-session
```

Skills live on your machine, not in your project. A SpecFlow upgrade reaches
every project at once — there is nothing to reinstall per repo, and nothing in
your project for an upgrade to overwrite.

`specflow-init` interviews you for what cannot be detected, detects and confirms
the rest, and writes `.specflow/config.md`. In an existing codebase it reads
your code and writes real documentation rather than leaving empty templates
behind.

To upgrade later:

```bash
npm install -g specflow-ai@latest && specflow update
```

That updates the machine install only. Your project files are untouched.

### Start Working

```bash
# Plan your first session
/plan-session

# Begin implementation
/start-session

# When done
/end-session
```

See [INSTALLATION.md](INSTALLATION.md) for detailed setup instructions.

## Project Modes

SpecFlow adapts to your situation:

| Mode | Use Case | Entry Point |
|------|----------|-------------|
| **Greenfield** | Fresh project, full flexibility | PRD + Tech Spec |
| **Constrained** | PoC with tech/process requirements | Constraints + Tech Spec |
| **Adoption** | Existing codebase, partial docs | Discovery scan + existing docs |

See [modes/](modes/) for detailed guidance on each.

## What Gets Generated

Skills are installed once per machine:

```
~/.claude/skills/
├── specflow-init/             # Sets up a project; carries the payload it installs
├── plan-session/
├── start-session/
├── end-session/
├── new-feature/               # Creates a feature SPEC and tagged tasks
└── plan-autonomous-batch/     # Clears a whole feature tag hands-off
```

After running `specflow-init`, your project will have:

```
your-project/
├── .specflow/
│   └── config.md              # Every project fact, read by every skill
├── CLAUDE.md                  # Root context for AI assistants
├── docs/                      # SpecFlow documentation (path is your choice)
│   ├── ROADMAP.md             # All tasks, tagged [feature: name]
│   ├── SESSION_LOG.md         # All sessions, tagged [feature-name]
│   ├── VISION.md              # Product north star (strategic)
│   ├── ADR.md                 # Architecture decisions (strategic)
│   ├── OVERVIEW.md            # Current system state (tactical)
│   ├── WORKFLOW.md            # Tech-specific commands (tactical)
│   ├── LEARNED_PATTERNS.md    # Discovered patterns
│   ├── ORCHESTRATION.md       # Session lifecycle and delegation contract
│   ├── AGENTS.md              # Agent catalog and delegation patterns
│   ├── CUSTOM.md              # Project-specific extensions
│   └── feature_docs/          # Per-feature specs
│       └── feature-name/
│           └── SPEC.md        # Feature requirements (frozen)
└── .claude/
    ├── hooks/                 # Automation hooks (optional)
    ├── rules/                 # Coding standards (optional)
    ├── settings.json          # Hook & statusline config (merged, not replaced)
    └── statusline.cjs          # Real-time status (optional)
```

Note what is **not** there: no `.claude/skills/`. Skills are on your machine.
Hooks and rules are still per-project because they are per-project things, but
they ship verbatim and read `.specflow/config.md` at runtime, so they never
drift out of step with your config.

All features use central ROADMAP/SESSION_LOG with `[feature: name]` tags.

## Documentation

### Getting Started
- [Installation Guide](INSTALLATION.md) - How to install and update
- [Migration Guide](MIGRATION.md) - Upgrading to the global-skills layout
- [Config Schema](configuration/CONFIG_SCHEMA.md) - What lives in `.specflow/config.md`
- [FAQ](FAQ.md) - Common questions and troubleshooting

### Core Concepts
- [Core Principles](core/PRINCIPLES.md) - Philosophy and core concepts
- [Documentation Structure](core/DOCUMENTATION.md) - The three-layer system
- [Session Workflow](core/SESSIONS.md) - Plan, implement, wrap up, pivot
- [Agent Orchestration](templates/payload/doc-templates/ORCHESTRATION.md) - Session lifecycle, delegation rules, checkpoints

### Project Modes
- [Greenfield Mode](modes/GREENFIELD.md) - New projects (with full example)
- [Constrained Mode](modes/CONSTRAINED.md) - Tech-constrained PoCs (Azure example)
- [Adoption Mode](modes/ADOPTION.md) - Existing projects (DBT + Rails examples)

### Configuration
- [Setup Questions](configuration/SETUP_QUESTIONS.md) - Discovery flow
- [Git Workflows](configuration/GIT_WORKFLOWS.md) - Solo, PR-review, CI/CD
- [Integrations](configuration/INTEGRATIONS.md) - Ticketing, CI/CD
- [Git Worktrees](configuration/WORKTREES.md) - Parallel feature development

### Prompts
- [INIT.md](prompts/INIT.md) - Initialize SpecFlow in any project
- [SETUP.md](prompts/SETUP.md) - PRD → Tech Spec generation
- [SESSIONS.md](prompts/SESSIONS.md) - Session prompts
- [PIVOT.md](prompts/PIVOT.md) - Pivot/retrospective prompts

### Examples
- [PRD Template](examples/PRD_TEMPLATE.md) - With filled example
- [Tech Spec Template](examples/TECH_SPEC_TEMPLATE.md) - With filled example
- [CLAUDE.md Examples](examples/) - For each mode (greenfield, constrained, adoption)

## Key Principles

1. **Specs before code** - Define what before how
2. **Documentation as source of truth** - If code and docs disagree, update docs to match code
3. **Session-based work** - Focused, trackable units of progress
4. **No manual metrics** - Automated or nothing
5. **Adaptive, not rigid** - Framework fits the project, not vice versa

## Updating

```bash
npm install -g specflow-ai@latest && specflow update
```

This updates the machine-level skills. **It does not touch your projects** —
there is nothing project-side for it to overwrite, so local customisation
cannot be lost.

If a release changes the shape of `.specflow/config.md`, the next skill you run
in a project notices, applies the additive parts itself, and offers anything
that needs a decision. It will not interrupt the task you asked for.

Re-running `specflow-init` in an already-initialised project is safe: it adds
what is missing and never rewrites a ROADMAP, SESSION_LOG or ADR that has real
content in it.

## Support

If you find SpecFlow useful, consider buying me a coffee!

<a href="https://buymeacoffee.com/jurebordon2" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="50">
</a>

## License

MIT
