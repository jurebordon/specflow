# Setup Discovery Questions

> Questions asked during SpecFlow initialization to configure the framework for your project.

The setup process uses these questions to generate appropriate documentation and commands. Not all questions apply to all modes.

---

## 1. Project Mode

**Question**: What type of project is this?

| Option | Description |
|--------|-------------|
| **Greenfield** | Fresh project, full flexibility, starting from PRD |
| **Constrained** | PoC or project with mandated technologies/processes |
| **Adoption** | Existing codebase, adding SpecFlow incrementally |

*Determines which setup flow to follow and what documentation to generate.*

---

## 2. Project Context

### Basic Information

- **Project name**: What should this project be called?
- **Short description**: One sentence describing what it does
- **Primary goal**: What problem does this solve?

### Scope (Greenfield/Constrained)

- **Do you have a PRD?** Yes / No / Partial
  - If yes: Please provide or point to it
  - If no: Would you like help creating one?

- **Do you have a Tech Spec?** Yes / No / Partial
  - If yes: Please provide or point to it
  - If no: Would you like to generate one from the PRD?

### Existing State (Adoption)

- **Do you have existing documentation?**
  - README? Where?
  - Architecture docs?
  - API docs?
  - Decision records?

- **May I scan the codebase?**
  - Yes: I'll analyze structure, patterns, and conventions
  - No: Please describe the project structure

---

## 3. Tech Stack

> **Note**: The CLI no longer asks tech stack questions. It scaffolds files with placeholder values (e.g., `# Detected by /init`). The `/init` command then detects your tech stack automatically and populates the config.

### For Full Manual Setup (prompts/INIT.md)

If using the manual prompt flow (no CLI), these questions help gather tech context:

### For Greenfield

- **Backend language and framework?** (e.g., Python/FastAPI, Node/Express, Go)
- **Frontend framework?** (e.g., React, Vue, None)
- **Database?** (e.g., PostgreSQL, MongoDB, SQLite)
- **Infrastructure?** (e.g., Docker, Kubernetes, serverless)

### For Constrained

- **Mandated technologies?** (must use)
- **Forbidden technologies?** (cannot use, with reason)
- **Integration requirements?** (existing systems to connect)
- **Compliance requirements?** (SOC2, HIPAA, GDPR, etc.)

### For Adoption

- **What's the primary language/framework?**
- **What database(s)?**
- **What test framework?**
- **Any key dependencies I should know about?**

---

## 4. Git Workflow

**Question**: How do you manage code changes?

| Option | Description | Commands Generated |
|--------|-------------|-------------------|
| **Solo** | Direct merge to main, single developer | merge-to-main.sh |
| **PR Review** | Feature branches, PR required for merge | create-pr (no auto-merge) |
| **CI/CD Gated** | MR/PR with automated merge via pipeline | create-mr (no local merge) |

### Follow-up Questions

**For Solo**:
- Default branch name? (main/master/other)

**For PR Review**:
- Platform? (GitHub / GitLab / Bitbucket / other)
- Required reviewers? (number or specific people)
- Required checks? (tests, linting, etc.)

**For CI/CD Gated**:
- Platform? (GitHub Actions / GitLab CI / Jenkins / other)
- MR/PR creation command? (gh pr create / glab mr create / other)
- Are there required pipelines before merge?

### Branch Naming

- **Convention?** (e.g., `type/description`, `TICKET-123-description`, custom)
- **Types used?** (feat, fix, refactor, docs, etc.)

### Parallel Development

**Question**: Do you work on multiple features in parallel?

| Option | Description |
|--------|-------------|
| **No** | One feature at a time |
| **Yes, with worktrees** | Use git worktrees for parallel features |
| **Yes, with branches** | Switch branches (stash/commit to switch) |

**If worktrees**:
- AI will suggest worktrees when detecting independent parallel tasks
- Session logs use feature-prefixed format to avoid merge conflicts
- See [WORKTREES.md](WORKTREES.md) for full workflow

---

## 5. Integrations (Optional)

### Ticketing System

**Question**: Do you use a ticketing system?

| Option | Integration |
|--------|-------------|
| **None** | No ticket references |
| **GitHub Issues** | Link to #123 format |
| **GitLab Issues** | Link to #123 format |
| **Jira** | Link to PROJ-123 format |
| **Linear** | Link to PROJ-123 format |
| **Other** | Custom format |

**If yes**:
- Should ROADMAP tasks reference tickets?
- Should session logs link to tickets?
- Should commits reference tickets?

### CI/CD

**Question**: Do you have CI/CD pipelines?

- **Platform?** (GitHub Actions / GitLab CI / Jenkins / CircleCI / other)
- **What runs on PR/MR?** (tests, lint, build, etc.)
- **What runs on merge to main?** (deploy, release, etc.)

### Other Integrations

- **Slack/Discord notifications?**
- **Documentation hosting?** (GitHub Pages, GitBook, etc.)
- **Monitoring/alerting?**

---

## 5.5 Technical Enforcement Layers

**Question**: Enable technical enforcement layers?

| Option | Description |
|--------|-------------|
| **Yes (recommended)** | Generate hooks, rules, and statusline for automated quality enforcement |
| **No** | Skip technical layers — generate only documentation and session commands |
| **Partial** | Choose which layers to enable individually |

### What Gets Generated

| Layer | Files Generated | Purpose |
|-------|----------------|---------|
| **Hooks** | `.claude/hooks/*.js` + settings.json config | Automated behaviors: auto-load context, block frozen docs, auto-format, compact suggestions, git push reminders |
| **Rules** | `.claude/rules/*.md` | Always-loaded guidelines: coding style, git workflow, security, testing, documentation conventions |
| **Statusline** | `.claude/statusline.js` + settings.json config | Real-time display: context usage %, feature name, TODO progress, git status |

### Follow-up (if Partial)

Select which layers to enable:
- **Hooks**: Session lifecycle automation
- **Rules**: Persistent coding guidelines
- **Statusline**: Real-time status display

### Variables Added to Config

| Variable | Source |
|----------|--------|
| **Format Command** | Detected from tech stack (e.g., `ruff format .`, `npx prettier --write .`) |
| **Typecheck Command** | Detected from tech stack (e.g., `mypy .`, `npx tsc --noEmit`) |

---

## 6. Documentation Location

**Question**: Should SpecFlow documentation be tracked in git?

| Option | Description | Use Case |
|--------|-------------|----------|
| **Tracked (default)** | `docs_specflow/` committed to repo | Team projects, shared context |
| **Gitignored** | `docs_specflow/` added to .gitignore | Personal workflow, team doesn't use AI |

### Follow-up Questions

**For Gitignored**:
- Should CLAUDE.md also be gitignored? (usually no - it's helpful even for non-AI users)

### What Gets Placed Where

| File | Tracked | Gitignored |
|------|---------|------------|
| CLAUDE.md | repo root | repo root* |
| docs_specflow/*.md | docs_specflow/ | docs_specflow/ (ignored) |
| .claude/commands/ | repo | repo |

*\*Can be gitignored if explicitly requested*

---

## 7. Agent Generation

> **Note**: The CLI now generates **all 8 agents by default** (5 core + 3 specialist). Agent selection questions have been removed from the CLI setup flow.

All agents are generated because they're harmless if unused. The `/init` command reports which agents are most relevant for your detected tech stack.

| Agent | Purpose | Default Model |
|-------|---------|---------------|
| **base.md** | Shared principles and session ritual | sonnet |
| **qa.md** | Test writing and quality assurance | sonnet |
| **architecture.md** | Architecture review (advisory, read-only) | opus |
| **backend.md** | Backend implementation patterns | sonnet |
| **frontend.md** | Frontend implementation patterns | sonnet |
| **build-error-resolver.md** | Build failures, type errors, dependencies | sonnet |
| **security-reviewer.md** | Security auditing (advisory, read-only) | opus |
| **refactor-cleaner.md** | Dead code removal, complexity reduction | sonnet |

### Model Tier Defaults

Model tiers use sensible defaults. Architecture and Security agents default to `opus` (reasoning-heavy advisory roles); all others default to `sonnet`.

Available tiers: `opus` (strongest reasoning), `sonnet` (balanced), `haiku` (fastest/cheapest)

To customize model tiers, edit `docs_specflow/.specflow-config.md` after setup and run `specflow update`.

---

## 8. Session Commands

**Question**: Which session commands do you need?

| Command | Purpose | Recommended |
|---------|---------|-------------|
| **plan-session** | Prepare for implementation | Always |
| **start-session** | Begin coding work | Always |
| **end-session** | Wrap up and merge | Always |
| **pivot-session** | Reassess direction | For longer projects |

Commands are generated based on your git workflow and integrations.

---

## Summary Output

After answering questions, setup provides:

1. **Configuration summary** - What was understood
2. **Files to be created** - List with descriptions
3. **Customization points** - What you might want to adjust
4. **Confirmation prompt** - Proceed or adjust?

---

## Changing Configuration Later

Configuration can be updated using `/pivot-session`:
- Tech stack changes
- Git workflow changes
- New integrations
- Role additions

Commands will be regenerated as needed.
