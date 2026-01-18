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

## 6. Documentation Location

**Question**: Where should SpecFlow documentation live?

| Option | Description | Use Case |
|--------|-------------|----------|
| **In Git (default)** | `docs/` folder, committed to repo | Team projects, shared context |
| **Separate Folder** | `specflow_docs/` folder, committed | Keep AI docs separate from regular docs |
| **Gitignored** | `docs/` or `specflow_docs/`, added to .gitignore | Personal workflow, team doesn't use AI |
| **External** | Outside repo (e.g., `~/.specflow/project-name/`) | Multiple repos, single tracking |

### Follow-up Questions

**For Separate Folder**:
- Folder name? (default: `specflow_docs/`)

**For Gitignored**:
- Which folder? (`docs/` or `specflow_docs/`)
- Should CLAUDE.md also be gitignored? (usually no - it's helpful even for non-AI users)

**For External**:
- Path? (default: `~/.specflow/<project-name>/`)
- Should CLAUDE.md still be in repo? (recommended: yes)

### What Gets Placed Where

| File | In Git | Separate | Gitignored | External |
|------|--------|----------|------------|----------|
| CLAUDE.md | repo root | repo root | repo root* | repo root* |
| docs/*.md | docs/ | specflow_docs/ | docs/ (ignored) | external path |
| .claude/commands/ | repo | repo | repo | repo |
| SESSION_LOG.md | docs/ | specflow_docs/ | location (ignored) | external path |

*\*Can be gitignored if explicitly requested*

---

## 7. Documentation Depth

**Question**: How much documentation do you want?

| Level | What's Generated |
|-------|-----------------|
| **Minimal** | CLAUDE.md, ROADMAP.md, SESSION_LOG.md, WORKFLOW.md |
| **Standard** | Above + VISION.md, OVERVIEW.md, ADR.md |
| **Full** | Above + agent guides, tech overlays |

*Recommendation based on mode:*
- Greenfield: Standard or Full
- Constrained: Standard or Full
- Adoption: Minimal, expand over time

---

## 8. Agent Roles

**Question**: Which AI agent roles are relevant?

| Role | When Relevant |
|------|---------------|
| **Backend** | API development, services, data access |
| **Frontend** | UI components, state management |
| **QA** | Testing, quality assurance |
| **Architecture** | Design decisions, system structure |
| **Data** | DBT, data pipelines, analytics |
| **DevOps** | Infrastructure, CI/CD, deployment |

*Select roles that match your work. Irrelevant roles won't be generated.*

---

## 9. Session Commands

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
