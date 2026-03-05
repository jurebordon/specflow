---
name: init-specflow
description: >-
  Populate skeleton SpecFlow documentation with AI-analyzed content. Scans
  codebase, detects tech stack, populates OVERVIEW, VISION, ROADMAP, ADR, and
  CLAUDE.md with project-specific content. Run once after specflow-ai init.
compatibility: Works with Claude Code, Codex CLI, and other Agent Skills-compatible tools
metadata:
  author: specflow
---
# Initialize SpecFlow Documentation

> Populate skeleton docs with AI-analyzed content. Run once after `specflow-ai init`.

---

## Step 1: Read Configuration

Find and read the SpecFlow config file:

```bash
# Locate the config (may be in docs_specflow/ or a custom path)
find . -maxdepth 3 -name ".specflow-config.md" -not -path '*/\.*/*' 2>/dev/null | head -3
```

If not found via find, check `CLAUDE.md` — it lists the docs path in the Documentation table.

Read the config file and extract:
- **Docs Path**: the directory containing SpecFlow docs (e.g. `docs_specflow/`, `docs/`, custom)
- **Mode**: greenfield / constrained / adoption
- **Tech Stack**: detected languages and tools
- **Existing Docs**: path to existing project documentation (if any)

> Use the discovered **Docs Path** for all file references in steps below (replacing `docs_specflow/` if different).

---

## Step 2: Gather Context (based on mode)

### For Adoption Mode:

1. **Read existing documentation first** (if `Existing Docs` path is set in config):
   - README, CONTRIBUTING, architecture docs, API docs
   - Any existing ADRs or design documents

2. **Scan the codebase**:
   ```bash
   # Directory structure (top 3 levels)
   find . -maxdepth 3 -type d -not -path '*/\.*' -not -path '*/node_modules/*' -not -path '*/venv/*' -not -path '*/__pycache__/*' -not -path '*/target/*' | head -60

   # Key configuration files
   ls -la | grep -E "(package\.json|requirements\.txt|Gemfile|go\.mod|Cargo\.toml|pom\.xml|dbt_project\.yml|Makefile|Dockerfile|\.env\.example)"
   ```

3. **Identify patterns**:
   - Code organization and naming conventions
   - Module/package structure
   - Test patterns and locations
   - Database models / key entities
   - API endpoints (if applicable)
   - Key dependencies and their roles

### For Greenfield Mode:

1. **Ask for PRD/Tech Spec**:
   - "Do you have a PRD or product requirements document? Paste it or provide the file path."
   - "Do you have a Tech Spec? If not, I can help draft one from the PRD."

2. **Extract from documents**:
   - Product description and problem statement
   - Target users
   - Core features / user journeys
   - Technical architecture decisions
   - Success metrics

### For Constrained Mode:

1. **Ask for constraints**:
   - "What technologies are mandated (must use)?"
   - "What technologies are forbidden (cannot use)?"
   - "What integration requirements exist?"

2. **Ask for PRD/Tech Spec** (same as greenfield)

3. **Extract within boundaries**: Same as greenfield, noting constraints in ADR

---

## Step 3: Populate Documentation

Using gathered context, update each skeleton doc. **Read each file first**, then replace TODO markers with real content.

### 3a. OVERVIEW.md (`<docs-path>/OVERVIEW.md`)

Fill in:
- **Section 1 (What This Product Does)**: 2-3 sentence product description
- **Section 2 (Core User Journeys)**: 2-4 concrete user journeys with IDs (UJ1, UJ2, ...)
- **Section 3 (Architecture)**:
  - Backend stack, directory structure (as a tree), main modules
  - Frontend section (if applicable, otherwise mark as N/A)
  - Data: primary database, key entities
  - Integrations: external services used
- **Section 4 (External Contracts)**: API specs, events, data schemas (if found)
- **Section 5 (Invariants)**: 3-5 rules that must always hold

### 3b. VISION.md (`<docs-path>/VISION.md`)

Fill in:
- **Problem Statement**: What problem does this project solve?
- **Solution Hypothesis**: How does it solve it?
- **Target Users**: Who benefits?
- **Success Metrics**: Qualitative indicators (don't invent numbers)
- **Non-Goals**: What is explicitly out of scope?
- **Tech Stack**: Confirm detected stack

### 3c. ROADMAP.md (`<docs-path>/ROADMAP.md`)

Fill in:
- **Current Phase**: Name the current development phase
- **Now**: 1-3 immediate tasks tagged with `[feature: name]`
  - For adoption: focus on understanding/documenting existing code
  - For greenfield: focus on initial scaffolding and first feature
  - For constrained: focus on setting up within constraints
- **Next**: 2-3 queued priorities tagged with `[feature: name]`
- **Later**: 2-3 backlog ideas

### 3d. ADR.md (`<docs-path>/ADR.md`)

Update **ADR-0001**:
- Fill in the **Decision** section with actual tech stack details:
  - Backend: language, framework, key libraries
  - Frontend: framework, state management (if applicable)
  - Database: type, ORM/query layer
  - Infrastructure: hosting, CI/CD, deployment approach
- Update **Consequences** with specific implications of the stack choices

### 3e. CLAUDE.md (root `CLAUDE.md`)

Update these sections (leave the rest as-is):
- **Key Patterns**: 3-5 discovered codebase patterns (naming conventions, file organization, etc.)
- **Invariants**: Copy from OVERVIEW.md invariants section
- Verify **Git Workflow** section is accurate

### 3f. CUSTOM.md (`<docs-path>/CUSTOM.md`)

This file is for project-specific context that extends SpecFlow defaults. **Read the file first** — if it has skeleton structure, populate it. If empty, leave it as-is.

Populate based on what you discovered:
- **External References**: Links to related repos, external APIs, or resources
- **Custom Commands**: Project-specific commands not covered by standard test/build/lint
- **Project Conventions**: Patterns unique to this project (e.g., "all API responses use this envelope")
- **Known Gotchas**: Common pitfalls or non-obvious behaviors you noticed
- **AI Guidelines**: Specific instructions for AI behavior in this project

**Note**: Don't invent content — only populate if you found relevant information during codebase exploration.

---

## Step 4: Detect Tech Stack & Commands

**This step always runs** — the CLI scaffolds with placeholder values that need real detection.

### 4a. Search Existing Documentation for Commands

**If `Existing Docs` path is set in config**, search those files FIRST for project-specific commands.

**CRITICAL: Extract commands EXACTLY as written in the docs. Do not modify, simplify, or "improve" them.**

1. **List and read all markdown files** in the existing docs path:
   ```bash
   find [EXISTING_DOCS_PATH] -name "*.md" -type f
   ```
   Read each file, especially READMEs and files with names like DEVELOPMENT, TESTING, GETTING_STARTED.

2. **Extract test commands verbatim**:
   - Look for sections titled "Tests", "Testing", "Running Tests", "How to Test"
   - Find code blocks that show how to run tests
   - **Copy the exact command** from the documentation — do not construct your own
   - Example: if docs say `uv run dbt_job.py t_logineko sandbox test`, use exactly that

3. **Extract build/lint/format commands verbatim**:
   - Look for "Linting", "Build", "Format", "Usage", "Commands" sections
   - Find code blocks showing these commands
   - **Copy exactly** — including any tool wrappers, paths, or arguments

4. **Check for task runners** (justfile, Makefile):
   ```bash
   find . -name "justfile" -o -name "Justfile" -o -name "Makefile" 2>/dev/null | head -5
   ```
   Read these files — they often define the canonical project commands.
   - For justfile: look for recipes like `test`, `lint`, `build`, `format`
   - Use `just <recipe>` as the command if found

5. **Report what you found before asking**:
   Show the user: "I found these commands in your documentation:"
   - Test: `[exact command from docs]` (source: [filename])
   - Build: `[exact command from docs]` (source: [filename])
   - Lint: `[exact command from docs]` (source: [filename])

   Then ask: "Are these correct?"

6. **Ask if commands are unclear or missing**:
   "I found testing documentation at [path] but couldn't determine the exact test command. What command should I use?"

### 4b. Fallback: Auto-Detect from File Patterns

**Only if no existing docs** or docs don't specify commands, use generic detection:

| File | Stack | Test Command | Build Command | Lint Command |
|------|-------|--------------|---------------|--------------|
| `package.json` | Node.js | `npm test` | `npm run build` | `npm run lint` |
| `pyproject.toml` | Python | `pytest` | `python -m build` | `ruff check` |
| `dbt_project.yml` | DBT | `dbt test` | `dbt build` | `sqlfluff lint` |
| `go.mod` | Go | `go test ./...` | `go build ./...` | `golangci-lint run` |
| `Cargo.toml` | Rust | `cargo test` | `cargo build` | `cargo clippy` |

**Always prefer documented commands over generic patterns.**

### 4c. Update Configuration

Update `<docs-path>/.specflow-config.md` with detected/discovered values:

- **Languages**: the detected tech stack (e.g. "Python, DBT", "TypeScript, React")
- **Frameworks**: detected frameworks (e.g. "FastAPI", "React", "DBT")
- **Test Command**: from existing docs OR auto-detected
- **Build Command**: from existing docs OR auto-detected
- **Lint Command**: from existing docs OR auto-detected
- **Format Command**: from existing docs OR auto-detected
- **Typecheck Command**: from existing docs OR auto-detected

### 4d. Update Skill Files Directly

**IMPORTANT**: Also update these skill files with the detected test commands:

1. **`.claude/skills/start-session/SKILL.md`** — Find the "Pre-flight Check" section and replace the test command placeholder with the actual command(s)

2. **`.claude/skills/end-session/SKILL.md`** — Find the "Final Tests" section and replace the test command placeholder with the actual command(s)

3. **`.claude/rules/testing.md`** — Update the Commands section with actual test/lint/typecheck commands

For mixed stacks (e.g., Python + DBT), include ALL relevant test commands:
```markdown
## Step 2: Pre-flight Check

Run baseline tests:
```bash
just pytest_components  # Python component tests
uv run dbt_job.py <tenant> sandbox test  # DBT model tests
```
```

**Do NOT leave `# Detected by /init` placeholders** — replace them with actual commands.

### 4e. Suggest Specialist Agents

Mention that specialist agents can be installed for focused expertise:

Show: "For specialist agents (backend, frontend, security, architecture, etc.), consider installing community agents from https://github.com/VoltAgent/awesome-claude-code-subagents"

---

## Step 5: Validate

After populating all docs, run a quick consistency check:
- OVERVIEW.md tech stack matches ADR-0001 decisions
- ROADMAP tasks are realistic for the current state
- CLAUDE.md Key Patterns reflect actual codebase conventions
- No TODO markers remain in populated sections

---

## Step 6: Self-Archive

This `/init-specflow` skill has served its purpose. Archive it:

```bash
# Move to docs for reference (use the docs path from Step 1)
mv .claude/skills/init-specflow/SKILL.md <docs-path>/INIT_PROMPT.md
rmdir .claude/skills/init-specflow/
```

Report to the user:
```
Documentation populated! Here's what was updated:

- OVERVIEW.md — System architecture and patterns
- VISION.md — Problem statement and direction
- ROADMAP.md — Initial task breakdown
- ADR.md — Tech stack decisions
- CLAUDE.md — Key patterns and invariants
- CUSTOM.md — Project-specific context (if populated)
- .specflow-config.md — Tech stack and commands
- start-session/SKILL.md — Pre-flight test commands
- end-session/SKILL.md — Final test commands
- testing.md — Test/lint/typecheck commands

The /init-specflow skill has been archived to <docs-path>/INIT_PROMPT.md.
```

Final next steps:
```
Next steps:
1. Review the generated documentation
2. Run /plan-session to start your first session
```

---

## Notes

- **Don't invent information** — if something is unclear, mark it as "TBD" rather than guessing
- **Be concise** — these docs are for AI context, not human prose
- **Adoption mode**: prioritize what EXISTS, not what SHOULD exist
- **Greenfield mode**: prioritize what's PLANNED, with clear TODOs for what's not yet decided
- For **existing docs path**: if the config specifies an existing docs path, read those files FIRST — they're the best source of project context
