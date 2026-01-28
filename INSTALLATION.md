# Installing SpecFlow

SpecFlow provides two installation methods: **CLI** (recommended) or **manual clone**.

---

## Quick Install (Recommended)

```bash
cd your-project

# 1. Interactive setup — scaffolds config, commands, hooks, rules, agents
npx specflow-ai init

# 2. AI detects tech stack and populates config
/init

# 3. Re-render templates with detected values
npx specflow-ai update
```

The CLI handles everything: creating directories, rendering templates, and setting up your project.

---

## What Gets Created

```
your-project/
├── CLAUDE.md                    # AI context file
├── docs_specflow/               # SpecFlow documentation (gitignored by default)
│   ├── .specflow-config.md      # Project settings
│   ├── OVERVIEW.md
│   ├── VISION.md
│   ├── ROADMAP.md
│   ├── ADR.md
│   ├── WORKFLOW.md
│   ├── SESSION_LOG.md
│   └── LEARNED_PATTERNS.md
└── .claude/
    ├── commands/                # Session workflow commands
    ├── agents/                  # 8 specialized agents
    ├── hooks/                   # Automation hooks
    ├── rules/                   # Coding standards
    ├── settings.json
    └── statusline.js
```

---

## The Three-Step Flow

### Step 1: `npx specflow-ai init`

Interactive CLI that asks about your project:
- Project type (greenfield, adoption, constrained)
- Git workflow (solo, PR-based)
- Documentation preferences
- Technical layers (hooks, rules, statusline)

Generates ~40 files with placeholder values for tech-specific commands.

### Step 2: `/init` (in Claude Code)

Open your project in Claude Code and run the `/init` command. The AI will:
- Scan your codebase to detect tech stack
- Update `.specflow-config.md` with real commands
- Report which agents are relevant for your stack

### Step 3: `npx specflow-ai update`

Re-renders commands, hooks, rules, and agents with the values detected by `/init`.

After this, your project has fully customized SpecFlow configuration.

---

## What Gets Tracked vs Ignored

| Path | Tracked | Purpose |
|------|---------|---------|
| `CLAUDE.md` | Yes | AI context file |
| `docs_specflow/` | No* | SpecFlow documentation |
| `.claude/commands/` | Yes | Session commands |
| `.claude/agents/` | Yes | Specialized agents |
| `.claude/hooks/` | Yes | Automation hooks |
| `.claude/rules/` | Yes | Coding standards |

*By default, `docs_specflow/` is gitignored. You can choose to track it during setup.

---

## CLI Options

### Non-Interactive Mode

```bash
# Accept all defaults
npx specflow-ai init --yes

# Specify project mode
npx specflow-ai init --mode greenfield
npx specflow-ai init --mode adoption
npx specflow-ai init --mode constrained
```

> **Note**: The `--yes` flag skips all prompts and uses defaults. If your project has existing documentation you want `/init` to read, run the interactive mode (without `--yes`) which asks for the existing docs path.

### Update Templates Only

After changing `.specflow-config.md`, re-render templates:

```bash
npx specflow-ai update
```

This updates commands, hooks, rules, and agents without touching your documentation.

---

## Alternative: Manual Installation

If you prefer not to use the CLI:

```bash
cd your-project

# Clone SpecFlow repository
git clone https://github.com/jurebordon/specflow .specflow

# Add to gitignore
echo ".specflow/" >> .gitignore
```

Then in Claude Code, paste the contents of `.specflow/prompts/INIT.md` to run the setup prompt manually.

---

## Sharing with Team

When a team member clones your project:

1. They clone your project (generated files are included)
2. They can immediately use `/plan-session`, `/start-session`, etc.
3. If they want to update templates, they run `npx specflow-ai update`

The `.specflow-config.md` and `.claude/` directory are tracked, so the team shares the same configuration.

---

## Updating SpecFlow

To get the latest CLI and templates:

```bash
# Clear npx cache and get latest
npx specflow-ai@latest init --help
```

Or if using manual installation:

```bash
cd your-project/.specflow
git pull
```

---

## Uninstalling

To remove SpecFlow from a project:

```bash
rm -rf docs_specflow/ .claude/
rm CLAUDE.md
# Remove docs_specflow/ line from .gitignore if present
```

Your project code remains unchanged.
