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
- **Tech-adaptive commands** (auto-detects your stack, generates appropriate commands)
- **Automatic feature detection** (from branch names, zero configuration)

## Quick Start

### Option A: CLI (Recommended)

```bash
cd your-project

# Interactive setup — scaffolds config, commands, hooks, rules, agents
npx specflow-ai init

# AI detects tech stack, populates config, generates documentation
/init

# Re-render templates with detected values
npx specflow-ai update

# Start working
/plan-session
```

The CLI scaffolds structural files with placeholder values. Then `/init` analyzes your codebase to detect tech stack and populate documentation. Finally, `specflow-ai update` re-renders templates with the real values.

To update commands and agents to the latest templates:

```bash
npx specflow-ai update
```

### Option B: Manual (AI-Assisted)

```bash
cd your-project

# Clone the framework
git clone https://github.com/jurebordon/specflow .specflow
echo ".specflow/" >> .gitignore

# Start Claude Code (or your AI assistant)
claude

# Paste the INIT prompt from .specflow/prompts/INIT.md
# Answer the discovery questions
# Review and confirm generated files
```

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

After initialization, your project will have:

```
your-project/
├── .specflow/                 # Framework (gitignored)
│   ├── templates/
│   ├── prompts/
│   └── configuration/
├── CLAUDE.md                  # Root context for AI assistants
├── docs_specflow/             # SpecFlow documentation (tracked or gitignored, your choice)
│   ├── .specflow-config.md    # Project settings
│   ├── ROADMAP.md             # All tasks, tagged [feature: name]
│   ├── SESSION_LOG.md         # All sessions, tagged [feature-name]
│   ├── VISION.md              # Product north star (strategic)
│   ├── ADR.md                 # Architecture decisions (strategic)
│   ├── OVERVIEW.md            # Current system state (tactical)
│   ├── WORKFLOW.md            # Tech-specific commands (tactical)
│   └── feature_docs/          # Per-feature specs
│       ├── user-auth/
│       │   └── SPEC.md        # Feature requirements (frozen)
│       └── api-v2/
│           └── SPEC.md
└── .claude/
    └── commands/              # Generated session commands
        ├── explore-project.md # For adoption mode
        ├── plan-session.md
        ├── start-session.md
        ├── end-session.md
        ├── new-feature.md
        └── new-worktree.md    # Advanced option
```

All features use central ROADMAP/SESSION_LOG with `[feature: name]` tags.

## Documentation

### Getting Started
- [Installation Guide](INSTALLATION.md) - How to install and update
- [Migration Guide](configuration/MIGRATION.md) - Upgrading from pre-2026-01-20 versions
- [FAQ](FAQ.md) - Common questions and troubleshooting

### Core Concepts
- [Core Principles](core/PRINCIPLES.md) - Philosophy and core concepts
- [Documentation Structure](core/DOCUMENTATION.md) - The three-layer system
- [Session Workflow](core/SESSIONS.md) - Plan, implement, wrap up, pivot

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
2. **Documentation as source of truth** - If code and docs disagree, update docs
3. **Session-based work** - Focused, trackable units of progress
4. **No manual metrics** - Automated or nothing
5. **Adaptive, not rigid** - Framework fits the project, not vice versa

## Updating

### CLI

```bash
npx specflow-ai update
```

This re-generates commands, hooks, rules, and agents from the latest templates. Your documentation and config are preserved.

### Manual

```bash
cd your-project/.specflow
git pull
```

Your project files are unaffected — only the templates update. Re-run the INIT prompt to regenerate files from updated templates.

## License

MIT
