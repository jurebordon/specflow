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
- **Session-based workflow** (plan → implement → wrap up)
- **Adaptive setup** that fits your project reality
- **Generated commands** tailored to your tech stack and git workflow

## Quick Start

### 1. Install SpecFlow in Your Project

```bash
cd your-project

# Clone the framework
git clone https://github.com/youruser/specflow .specflow

# Add to gitignore (it's tooling, not a dependency)
echo ".specflow/" >> .gitignore
```

### 2. Initialize Your Project

```bash
# Start Claude Code (or your AI assistant)
claude

# Paste the INIT prompt from .specflow/prompts/INIT.md
# Answer the discovery questions
# Review and confirm generated files
```

### 3. Start Working

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
├── .specflow/                # Framework (gitignored)
│   ├── templates/
│   ├── prompts/
│   └── configuration/
├── .specflow-config.md       # Project settings (tracked)
├── CLAUDE.md                 # Root context for AI assistants
├── docs/
│   ├── VISION.md             # Product north star (strategic)
│   ├── ADR.md                # Architecture decisions (strategic)
│   ├── OVERVIEW.md           # Current system state (tactical)
│   ├── ROADMAP.md            # Now/Next/Later tasks (tactical)
│   ├── WORKFLOW.md           # How to work on this repo (tactical)
│   └── SESSION_LOG.md        # Session journal (operational)
├── .claude/
│   └── commands/             # Generated session commands
│       ├── plan-session.md
│       ├── start-session.md
│       ├── end-session.md
│       ├── pivot-session.md
│       ├── new-feature.md    # If using features
│       └── new-worktree.md   # If using worktrees
└── .ai/
    └── agents/               # Role-specific guides (Full depth)
        ├── backend.md
        ├── frontend.md
        └── ...
```

The exact structure adapts based on your answers during setup.

## Documentation

### Getting Started
- [Installation Guide](INSTALLATION.md) - How to install and update
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
- [Feature Documentation](configuration/FEATURES.md) - Per-feature tracking
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

To get the latest templates:

```bash
cd your-project/.specflow
git pull
```

Your project files are unaffected - only the templates update.

## License

MIT
