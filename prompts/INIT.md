# SpecFlow Initialization Prompt

> Copy this prompt into your AI assistant to initialize SpecFlow in any project.

---

## Prerequisites

Before running the INIT prompt, clone SpecFlow into your project:

```bash
cd your-project

# Clone the framework
git clone https://github.com/youruser/specflow .specflow

# Add to gitignore (framework is optional tooling, not a dependency)
echo ".specflow/" >> .gitignore
```

This gives the AI access to templates at `.specflow/templates/`.

---

## The Prompt

```
You are initializing SpecFlow, a spec-driven framework for AI-assisted development.

## Step 0: Verify Framework

Check if `.specflow/` exists in this project.

If YES: Read these reference files to understand the templates:
- .specflow/templates/CLAUDE.md.template
- .specflow/templates/docs/*.template
- .specflow/templates/commands/*.template
- .specflow/configuration/SETUP_QUESTIONS.md

If NO: Ask the user to run:
  git clone https://github.com/youruser/specflow .specflow
  echo ".specflow/" >> .gitignore

Then continue.

## Step 1: Determine Project Mode

Ask: "What type of project is this?"
- **Greenfield**: Fresh project, starting from PRD and Tech Spec
- **Constrained**: PoC or project with mandated technologies/processes
- **Adoption**: Existing codebase, adding structure incrementally

## Step 2: Gather Context (based on mode)

### For Greenfield:
- Do you have a PRD? (provide it or I can help create one)
- Do you have a Tech Spec? (provide it or I can generate from PRD)
- What's the tech stack? (backend, frontend, database)

### For Constrained:
- What technologies are mandated? (must use)
- What technologies are forbidden? (cannot use)
- What integration requirements exist?
- Do you have a PRD and Tech Spec?

### For Adoption:
- May I scan the codebase to understand structure? (yes/no)
  - If no: Please describe the project structure and tech stack
- Do you have existing documentation? (README, architecture docs, etc.)
- What's the current tech stack?

## Step 3: Git Workflow

Ask: "How do you manage code changes?"
- **Solo**: Direct merge to main, single developer
- **PR Review**: Feature branches with PR/MR review required
- **CI/CD Gated**: MR/PR with automated merge via pipeline

Follow-up based on answer:
- Platform? (GitHub/GitLab/Bitbucket)
- Branch naming convention? (e.g., feat/description, TICKET-123-description)
- Required reviewers or checks?

Ask: "Do you work on multiple features in parallel?"
- **No**: One feature at a time
- **Yes, with worktrees**: Use git worktrees for parallel features
- **Yes, with branches**: Switch branches (stash/commit to switch)

## Step 4: Optional Integrations

Ask: "Do you use any of these?" (select all that apply)
- Ticketing system (GitHub Issues, Jira, Linear, etc.)
- CI/CD pipeline (GitHub Actions, GitLab CI, etc.)

For each "yes", ask:
- Ticketing: What format? (e.g., PROJ-123, #123)
- CI/CD: What platform? What runs on PR?

## Step 5: Documentation Location

Ask: "Where should SpecFlow documentation live?"
- **In Git (default)**: `docs/` folder, committed to repo
- **Separate Folder**: Custom folder name, committed
- **Gitignored**: In repo but added to .gitignore
- **External**: Outside repo entirely

## Step 6: Documentation Depth

Ask: "How much documentation structure do you want?"
- **Minimal**: CLAUDE.md, ROADMAP, SESSION_LOG, WORKFLOW
- **Standard**: Above + VISION, OVERVIEW, ADR
- **Full**: Above + agent guides for relevant roles

## Step 7: Generate Configuration

Create `.specflow-config.md` (this file IS tracked, unlike .specflow/):

```markdown
# SpecFlow Project Configuration

## Project
- **Name**: [PROJECT_NAME]
- **Mode**: [greenfield/constrained/adoption]
- **Description**: [one-liner]

## Tech Stack
- **Backend**: [language/framework]
- **Frontend**: [framework or "none"]
- **Database**: [database]

## Git Workflow
- **Type**: [solo/pr-review/ci-cd-gated]
- **Platform**: [GitHub/GitLab/Bitbucket]
- **Default Branch**: [main/master]
- **Branch Convention**: [e.g., feat/description]
- **Uses Worktrees**: [yes/no]

## Integrations
- **Ticketing**: [system] (format: [TICKET-123])
- **CI/CD**: [platform]

## Documentation
- **Path**: [docs/ or custom]
- **Depth**: [minimal/standard/full]
- **Location**: [in-git/separate/gitignored/external]
```

## Step 8: Generate Project Files

Read templates from `.specflow/templates/` and generate:

### Always Generate:
- `CLAUDE.md` - Use `.specflow/templates/CLAUDE.md.template`
- `[DOCS_PATH]/ROADMAP.md` - Use `.specflow/templates/docs/ROADMAP.md.template`
- `[DOCS_PATH]/SESSION_LOG.md` - Use `.specflow/templates/docs/SESSION_LOG.md.template`
- `[DOCS_PATH]/WORKFLOW.md` - Use `.specflow/templates/docs/WORKFLOW.md.template`

### Generate Session Commands:
Copy and customize from `.specflow/templates/commands/`:
- `.claude/commands/plan-session.md`
- `.claude/commands/start-session.md`
- `.claude/commands/end-session.md`
- `.claude/commands/pivot-session.md`

### For Standard/Full depth:
- `[DOCS_PATH]/VISION.md` - Use `.specflow/templates/docs/VISION.md.template`
- `[DOCS_PATH]/OVERVIEW.md` - Use `.specflow/templates/docs/OVERVIEW.md.template`
- `[DOCS_PATH]/ADR.md` - Use `.specflow/templates/docs/ADR.md.template`

### For Greenfield/Constrained with PRD/Spec:
- `[DOCS_PATH]/frozen/PRD.md` - User's PRD
- `[DOCS_PATH]/frozen/TECH_SPEC.md` - User's Tech Spec

### If using worktrees or features:
- `.claude/commands/new-feature.md` - Use `.specflow/templates/commands/new-feature.md.template`
- `.claude/commands/new-worktree.md` - Use `.specflow/templates/commands/new-worktree.md.template`

### For Full depth:
- `.ai/agents/*.md` - Use `.specflow/templates/agents/*.template` for relevant roles

## Step 9: Populate from PRD/Tech Spec

If user provided PRD:
- Extract features → populate ROADMAP.md (Now/Next/Later)
- Extract vision → populate VISION.md
- Extract success criteria → add to CLAUDE.md

If user provided Tech Spec:
- Extract architecture → populate OVERVIEW.md
- Extract decisions → populate ADR.md
- Extract patterns → add to CLAUDE.md

## Step 10: Confirm and Create

Before creating files:
1. Show configuration summary
2. List all files to be created
3. Ask for confirmation
4. Do NOT overwrite existing files without permission

After creating:
1. List all files created
2. Highlight any TODOs to fill
3. Suggest: "Run /plan-session to start your first session"

## Template Variable Reference

When processing templates, replace these variables:

| Variable | Source |
|----------|--------|
| {{PROJECT_NAME}} | config |
| {{PROJECT_DESCRIPTION}} | config |
| {{PROJECT_TYPE}} | config (mode) |
| {{TECH_STACK}} | config |
| {{GIT_WORKFLOW}} | config |
| {{DOCS_PATH}} | config (documentation path) |
| {{DEFAULT_BRANCH}} | config |
| {{BRANCH_CONVENTION}} | config |
| {{USES_WORKTREES}} | config |
| {{TICKETING}} | config |
| {{TICKET_FORMAT}} | config |
| {{DATE}} | current date |

Conditional blocks use Handlebars syntax:
- {{#if VARIABLE}}...{{/if}}
- {{#each ARRAY}}...{{/each}}

## Important Rules

- Always read templates from `.specflow/templates/` - don't improvise structure
- Reference `.specflow/configuration/` for guidance on questions
- Store project config in `.specflow-config.md` (tracked by git)
- The `.specflow/` folder itself stays gitignored
- Commands should read from `.specflow-config.md` for variables
- If gitignored docs location, add to .gitignore
- Respect existing files - ask before overwriting
```

---

## Quick Setup Flow

```bash
# 1. Clone SpecFlow into your project
cd my-project
git clone https://github.com/youruser/specflow .specflow
echo ".specflow/" >> .gitignore

# 2. Start Claude Code
claude

# 3. Paste the INIT prompt above

# 4. Answer discovery questions

# 5. Review and confirm generated files
```

---

## What Gets Created

```
my-project/
├── .specflow/                 # Cloned framework (gitignored)
│   ├── templates/
│   ├── prompts/
│   └── configuration/
├── .specflow-config.md        # Project settings (tracked)
├── CLAUDE.md                  # AI context (tracked)
├── docs/
│   ├── ROADMAP.md
│   ├── SESSION_LOG.md
│   ├── WORKFLOW.md
│   ├── VISION.md              # Standard/Full
│   ├── OVERVIEW.md            # Standard/Full
│   ├── ADR.md                 # Standard/Full
│   └── frozen/                # If PRD/Spec provided
│       ├── PRD.md
│       └── TECH_SPEC.md
├── .claude/
│   └── commands/
│       ├── plan-session.md
│       ├── start-session.md
│       ├── end-session.md
│       ├── pivot-session.md
│       ├── new-feature.md     # If using features
│       └── new-worktree.md    # If using worktrees
└── .ai/
    └── agents/                # Full depth only
        └── *.md
```

---

## Updating SpecFlow

To get the latest templates:

```bash
cd .specflow
git pull
```

Your project config and generated files are unaffected.

---

## Example Session

**You**: [paste INIT prompt]

**AI**: I see `.specflow/` exists. Let me read the templates...

What type of project is this?
- Greenfield
- Constrained
- Adoption

**You**: Greenfield, here's my PRD and tech spec [paste]

**AI**: Got it. Git workflow?

**You**: PR Review on GitHub, with worktrees

**AI**: Integrations?

**You**: GitHub Issues, GitHub Actions

**AI**: Documentation location and depth?

**You**: Default docs/, Standard depth

**AI**: Here's what I'll create:

**Config** (.specflow-config.md):
- Mode: Greenfield
- Git: PR Review, GitHub, worktrees
- Docs: docs/, Standard
- Integrations: GitHub Issues (#123), GitHub Actions

**Files** (15 total):
- .specflow-config.md
- CLAUDE.md
- docs/ROADMAP.md, SESSION_LOG.md, WORKFLOW.md
- docs/VISION.md, OVERVIEW.md, ADR.md
- docs/frozen/PRD.md, TECH_SPEC.md
- .claude/commands/plan-session.md, start-session.md, end-session.md, pivot-session.md, new-feature.md, new-worktree.md

Proceed?

**You**: Yes

**AI**: Done! Created 15 files. ROADMAP.md has 8 tasks from your PRD.

Next: Run `/plan-session` to start your first implementation session.
