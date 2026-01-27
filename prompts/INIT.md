# SpecFlow Initialization Prompt

> Copy this prompt into your AI assistant to initialize SpecFlow in any project.

**Prefer the CLI?** Run `npx specflow init` for an interactive setup that handles everything below automatically. The manual prompt below is for AI-assisted initialization without the CLI.

---

## Prerequisites

Before running the INIT prompt, clone SpecFlow into your project:

```bash
cd your-project

# Clone the framework
git clone https://github.com/jurebordon/specflow .specflow

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
- .specflow/configuration/AGENT_TIERS.md
- .specflow/examples/CLAUDE_GREENFIELD.md, CLAUDE_CONSTRAINED.md, CLAUDE_ADOPTION.md (rendered examples for each mode — use as reference when generating CLAUDE.md)

If NO: Ask the user to run:
  git clone https://github.com/jurebordon/specflow .specflow
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

## Step 5: Tech Stack Detection

Ask: "May I scan your project to detect the tech stack? This helps generate appropriate test/build/lint commands."

**If YES**:
- Scan for common files:
  - `package.json` → Node.js
  - `requirements.txt` or `pyproject.toml` → Python
  - `dbt_project.yml` → DBT
  - `Gemfile` → Ruby
  - `go.mod` → Go
  - `Cargo.toml` → Rust
  - `pom.xml` or `build.gradle` → Java
- Identify: language(s), framework(s), test runner, build tool
- Show findings: "Found: Python + DBT + pytest"
- Ask: "Is this correct? Any additional tools to note?"

**If NO**:
- Ask: "Please describe your tech stack (language, framework, test tool, build tool)"

Store in config for generating tech-adaptive commands.

## Step 5.5: Technical Enforcement Layers

Ask: "Enable technical enforcement layers? These add automated hooks, coding rules, and a statusline to improve AI-assisted development."

Options:
- **Yes (recommended)**: Generate hooks, rules, and statusline
- **No**: Skip technical layers (docs and commands only)
- **Partial**: Choose which layers to enable

If YES: Enable all layers.

If PARTIAL, ask which to enable:
- **Hooks**: Automated behaviors at session lifecycle points (auto-load context, format code, block frozen doc edits)
- **Rules**: Always-loaded coding guidelines (style, git, security, testing, documentation conventions)
- **Statusline**: Real-time display showing context usage, feature name, and TODO progress

Store in config:
- **Hooks**: enabled/disabled
- **Rules**: enabled/disabled
- **Statusline**: enabled/disabled

## Step 6: Documentation Tracking

Ask: "Should docs_specflow/ be tracked in git or gitignored?"
- **Gitignored (recommended)**: Start personal, unignore later if team adopts
- **Tracked**: Team shares SpecFlow documentation from day one

**Note**: All SpecFlow documentation will live in `docs_specflow/` folder.

## Step 7: Generate Configuration

Create `docs_specflow/.specflow-config.md` (inherits tracking from docs_specflow/):

```markdown
# SpecFlow Project Configuration

## Project
- **Name**: [PROJECT_NAME]
- **Mode**: [greenfield/constrained/adoption]
- **Description**: [one-liner]

## Tech Stack
- **Languages**: [python, typescript, etc.]
- **Frameworks**: [dbt, fastapi, react, etc.]
- **Test Command**: [pytest / npm test / dbt test / etc.]
- **Build Command**: [python -m build / npm run build / dbt build / etc.]
- **Lint Command**: [ruff check . / eslint . / sqlfluff lint / etc.]

{{#if MIXED_STACK}}
## Tech Commands (Mixed Stack)
- **Test Commands**:
  - Python: pytest
  - DBT: dbt test
- **Build Commands**:
  - Python: python -m build
  - DBT: dbt build
- **Lint Commands**:
  - Python: ruff check .
  - SQL: sqlfluff lint
{{/if}}

## Git Workflow
- **Type**: [solo/pr-review/ci-cd-gated]
- **Platform**: [GitHub/GitLab/Bitbucket]
- **Default Branch**: [main/master]
- **Branch Convention**: [e.g., feat/description]

## Integrations
- **Ticketing**: [system] (format: [TICKET-123])
- **CI/CD**: [platform]

## Documentation
- **Path**: docs_specflow/
- **Tracking**: [gitignored/tracked]

## Technical Layers
- **Hooks**: [enabled/disabled]
- **Rules**: [enabled/disabled]
- **Statusline**: [enabled/disabled]
- **Format Command**: [ruff format . / npx prettier --write . / etc.]
- **Typecheck Command**: [mypy . / npx tsc --noEmit / etc.]
```

## Step 8: Check for Existing CLAUDE.md

Check if `CLAUDE.md` exists anywhere in the project root.

**If EXISTS**:
- Ask: "I found an existing CLAUDE.md. May I add SpecFlow context to it?"
  - **Yes**: Append SpecFlow section to existing file
  - **No**: Create `CLAUDE-SPECFLOW.md` instead and add reference note

**If NOT EXISTS**:
- Proceed to create new `CLAUDE.md`

## Step 9: Generate Project Files

Read templates from `.specflow/templates/` and generate:

### Always Generate:
- `CLAUDE.md` (or append to existing) - Use `.specflow/templates/CLAUDE.md.template`
- `docs_specflow/.specflow-config.md` - Configuration file
- `docs_specflow/ROADMAP.md` - Use `.specflow/templates/docs/ROADMAP.md.template`
- `docs_specflow/SESSION_LOG.md` - Use `.specflow/templates/docs/SESSION_LOG.md.template`
- `docs_specflow/WORKFLOW.md` - Use `.specflow/templates/docs/WORKFLOW.md.template`
- `docs_specflow/VISION.md` - Use `.specflow/templates/docs/VISION.md.template`
- `docs_specflow/OVERVIEW.md` - Use `.specflow/templates/docs/OVERVIEW.md.template`
- `docs_specflow/ADR.md` - Use `.specflow/templates/docs/ADR.md.template`
- `docs_specflow/LEARNED_PATTERNS.md` - Use `.specflow/templates/docs/LEARNED_PATTERNS.md.template`

### Generate Session Commands:
Copy and customize from `.specflow/templates/commands/`:
- `.claude/commands/explore-project.md` - For adoption mode
- `.claude/commands/plan-session.md`
- `.claude/commands/start-session.md`
- `.claude/commands/end-session.md`
- `.claude/commands/verify.md` - Validate docs consistency and project health
- `.claude/commands/new-feature.md`
- `.claude/commands/new-worktree.md` - Advanced, for parallel development

### Generate Technical Layers (if enabled):

**Hooks** (if enabled):
Copy and customize from `.specflow/templates/hooks/`:
- `.claude/hooks/session-start-context.js` - Auto-load project context on session start
- `.claude/hooks/doc-file-blocker.js` - Block edits to frozen documentation
- `.claude/hooks/auto-format.js` - Auto-format code after edits
- `.claude/hooks/compact-suggester.js` - Suggest /compact at high context usage
- `.claude/hooks/git-push-reminder.js` - Remind to push unpushed commits
- `.claude/hooks/session-end-persist.js` - Save session state snapshot
- `.claude/hooks/continuous-learning.js` - Periodic reminder to capture learned patterns

Merge `.specflow/templates/settings/hooks.json.template` into `.claude/settings.json`

**Rules** (if enabled):
Copy and customize from `.specflow/templates/rules/`:
- `.claude/rules/coding-style.md` - Language-specific coding standards
- `.claude/rules/git-workflow.md` - Branch, commit, and PR conventions
- `.claude/rules/security.md` - Secret protection and secure coding
- `.claude/rules/testing.md` - Test commands and quality standards
- `.claude/rules/documentation.md` - SpecFlow documentation conventions

**Statusline** (if enabled):
Copy and customize from `.specflow/templates/settings/`:
- `.claude/statusline.js` - Real-time status display
Add statusLine config to `.claude/settings.json`:
```json
{ "statusLine": { "command": "node .claude/statusline.js" } }
```

### Generate Agents:
Copy and customize from `.specflow/templates/agents/`:

**Always generate** (core agents):
- `.claude/agents/base.md` - Base agent with shared principles and session ritual
- `.claude/agents/qa.md` - Test writing and quality assurance
- `.claude/agents/architecture.md` - Architecture review and system design (read-only, advisory)
- `.claude/agents/backend.md` - Backend implementation patterns
- `.claude/agents/frontend.md` - Frontend implementation patterns

**Generate based on user selection** (specialist agents — ask in Step 5.5 or default to all if technical layers enabled):
- `.claude/agents/build-error-resolver.md` - Diagnose and fix build failures, type errors, dependency issues
- `.claude/agents/security-reviewer.md` - Security auditing, OWASP top 10 review (read-only, advisory)
- `.claude/agents/refactor-cleaner.md` - Dead code removal, complexity reduction, naming improvements

Each agent template includes YAML frontmatter with a configurable `model` field using `{{AGENT_MODEL_*}}` variables. Defaults are defined in `.specflow/configuration/AGENT_TIERS.md`. Architecture and Security agents default to `opus` (reasoning-heavy advisory roles); all others default to `sonnet`.

### For Greenfield/Constrained with PRD/Spec:
- `docs_specflow/frozen/PRD.md` - User's PRD
- `docs_specflow/frozen/TECH_SPEC.md` - User's Tech Spec

### Create Gitignore if Needed:
If docs_specflow/ should be gitignored:
- Add `docs_specflow/` to `.gitignore`

## Step 10: Populate from PRD/Tech Spec

**For Greenfield/Constrained**:

If user provided PRD:
- Extract features → Create `docs_specflow/feature_docs/[name]/SPEC.md` for each feature
- Extract feature tasks → Add to ROADMAP.md tagged with `[feature: name]`
- Extract vision → populate VISION.md
- Extract success criteria → add to CLAUDE.md

If user provided Tech Spec:
- Extract architecture → populate OVERVIEW.md
- Extract decisions → populate ADR.md
- Extract patterns → add to CLAUDE.md and WORKFLOW.md

**For Adoption**:
- Suggest: "Run `/explore-project` to scan your codebase"
- Or: "Run `/new-feature` when ready to plan your first feature"

## Step 11: Confirm and Create

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
| {{TECH_STACK}} | config (comma-separated languages/frameworks) |
| {{TEST_COMMAND}} | config |
| {{BUILD_COMMAND}} | config |
| {{LINT_COMMAND}} | config |
| {{GIT_WORKFLOW}} | config |
| {{DEFAULT_BRANCH}} | config |
| {{BRANCH_CONVENTION}} | config |
| {{TICKETING}} | config |
| {{TICKET_FORMAT}} | config |
| {{DATE}} | current date |
| {{FORMAT_COMMAND}} | config |
| {{TYPECHECK_COMMAND}} | config |
| {{DOCS_PATH}} | config (default: docs_specflow) |
| {{ENABLE_HOOKS}} | config |
| {{ENABLE_RULES}} | config |
| {{ENABLE_STATUSLINE}} | config |
| {{AGENT_MODEL_BASE}} | config (default: sonnet) |
| {{AGENT_MODEL_QA}} | config (default: sonnet) |
| {{AGENT_MODEL_ARCHITECTURE}} | config (default: opus) |
| {{AGENT_MODEL_BACKEND}} | config (default: sonnet) |
| {{AGENT_MODEL_FRONTEND}} | config (default: sonnet) |
| {{AGENT_MODEL_BUILD_ERROR}} | config (default: sonnet) |
| {{AGENT_MODEL_SECURITY}} | config (default: opus) |
| {{AGENT_MODEL_REFACTOR}} | config (default: sonnet) |
| {{PYTHON}} | detected (boolean) |
| {{TYPESCRIPT}} | detected (boolean) |
| {{GO}} | detected (boolean) |
| {{RUST}} | detected (boolean) |
| {{RUBY}} | detected (boolean) |
| {{JAVA}} | detected (boolean) |
| {{DBT}} | detected (boolean) |

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
git clone https://github.com/jurebordon/specflow .specflow
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
├── docs_specflow/
│   ├── ROADMAP.md
│   ├── SESSION_LOG.md
│   ├── WORKFLOW.md
│   ├── VISION.md
│   ├── OVERVIEW.md
│   ├── ADR.md
│   ├── LEARNED_PATTERNS.md    # Discovered patterns journal
│   └── frozen/                # If PRD/Spec provided
│       ├── PRD.md
│       └── TECH_SPEC.md
├── .claude/
│   ├── commands/
│   │   ├── plan-session.md
│   │   ├── start-session.md
│   │   ├── end-session.md
│   │   ├── verify.md
│   │   └── ...
│   ├── hooks/                    # If hooks enabled
│   │   ├── session-start-context.js
│   │   ├── doc-file-blocker.js
│   │   ├── auto-format.js
│   │   ├── compact-suggester.js
│   │   ├── git-push-reminder.js
│   │   ├── session-end-persist.js
│   │   └── continuous-learning.js
│   ├── rules/                    # If rules enabled
│   │   ├── coding-style.md
│   │   ├── git-workflow.md
│   │   ├── security.md
│   │   ├── testing.md
│   │   └── documentation.md
│   ├── agents/                   # Role-specific agents
│   │   ├── base.md              # Shared principles
│   │   ├── qa.md                # Test & quality
│   │   ├── architecture.md      # Architecture review (advisory)
│   │   ├── backend.md           # Backend patterns
│   │   ├── frontend.md          # Frontend patterns
│   │   ├── build-error-resolver.md  # Build failure diagnosis
│   │   ├── security-reviewer.md     # Security auditing (advisory)
│   │   └── refactor-cleaner.md      # Dead code & complexity
│   ├── statusline.js             # If statusline enabled
│   └── settings.json             # Hooks + statusline config
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
