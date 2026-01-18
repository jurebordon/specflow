# Installing SpecFlow

SpecFlow is installed as a gitignored clone within your project. This keeps templates accessible to the AI while not polluting your project's git history.

---

## Quick Install

```bash
cd your-project

# Clone SpecFlow
git clone https://github.com/jurebordon/specflow .specflow

# Add to gitignore
echo ".specflow/" >> .gitignore
```

That's it. Now you can run the INIT prompt.

---

## What Gets Installed

```
your-project/
└── .specflow/              # Gitignored
    ├── README.md
    ├── INSTALLATION.md     # This file
    ├── FAQ.md
    ├── core/               # Principles and concepts
    ├── configuration/      # Setup questions and guides
    ├── modes/              # Greenfield, Constrained, Adoption
    ├── prompts/            # INIT and other prompts
    └── templates/          # Document and command templates
```

---

## Initialize a Project

After installing, start Claude Code and paste the INIT prompt:

```bash
# Start Claude in your project
cd your-project
claude

# Then paste the prompt from .specflow/prompts/INIT.md
```

The AI will:
1. Read templates from `.specflow/templates/`
2. Ask discovery questions
3. Generate project files (CLAUDE.md, docs/, .claude/commands/)
4. Create `.specflow-config.md` with your settings

---

## What Gets Tracked vs Ignored

| Path | Tracked | Purpose |
|------|---------|---------|
| `.specflow/` | No | Framework templates (gitignored) |
| `.specflow-config.md` | Yes | Project-specific settings |
| `CLAUDE.md` | Yes | AI context file |
| `docs/` | Yes* | Project documentation |
| `.claude/commands/` | Yes | Session commands |

*Unless you chose gitignored docs location during setup

---

## Updating SpecFlow

Get the latest templates:

```bash
cd your-project/.specflow
git pull
```

Your project files are unaffected - only the templates update.

---

## Multiple Projects

Each project gets its own `.specflow/` clone:

```
~/Dev/
├── project-a/
│   └── .specflow/    # Independent clone
├── project-b/
│   └── .specflow/    # Independent clone
└── project-c/
    └── .specflow/    # Independent clone
```

This allows different projects to use different versions if needed.

---

## Sharing with Team

When a team member clones your project:

1. They clone your project (`.specflow/` is gitignored, so not included)
2. They run the install command:
   ```bash
   git clone https://github.com/jurebordon/specflow .specflow
   ```
3. They can now use the same session commands

The `.specflow-config.md` IS tracked, so they get your project settings automatically.

---

## Alternative: Global Install

If you prefer a single SpecFlow installation:

```bash
# Clone once to a global location
git clone https://github.com/jurebordon/specflow ~/.specflow

# In each project, symlink or reference it
ln -s ~/.specflow .specflow
```

Note: This means all projects share the same version.

---

## Uninstalling

To remove SpecFlow from a project:

```bash
rm -rf .specflow
# Remove the .specflow/ line from .gitignore
```

Your project files (CLAUDE.md, docs/, commands/) remain and continue to work.
