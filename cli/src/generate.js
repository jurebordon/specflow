import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import chalk from 'chalk';
import { renderTemplate } from './render.js';

/**
 * Get the path to bundled templates.
 * In development (running from repo), uses repo root templates/.
 * In production (npm package), uses cli/templates/.
 *
 * @param {string} cliRoot - Path to the cli/ directory
 * @returns {string} Path to the templates root
 */
export function getTemplatesRoot(cliRoot) {
  // Check for bundled templates first (npm package)
  const bundled = resolve(cliRoot, 'templates', 'templates');
  if (existsSync(bundled)) {
    return bundled;
  }
  // Fall back to repo root (development)
  const repoRoot = resolve(cliRoot, '..');
  return resolve(repoRoot, 'templates');
}

/**
 * Get the path to bundled configuration.
 *
 * @param {string} cliRoot - Path to the cli/ directory
 * @returns {string} Path to the configuration root
 */
export function getConfigRoot(cliRoot) {
  const bundled = resolve(cliRoot, 'templates', 'configuration');
  if (existsSync(bundled)) {
    return bundled;
  }
  const repoRoot = resolve(cliRoot, '..');
  return resolve(repoRoot, 'configuration');
}

/**
 * Build manifest for files the CLI can render (has the template variables for).
 * Used by `specflow-ai init` — excludes docs that need AI content.
 *
 * @param {string} templatesRoot - Path to the templates directory
 * @param {Record<string, unknown>} config - User configuration
 * @returns {Array<{template: string, output: string, description: string}>}
 */
export function buildStructuralManifest(templatesRoot, config) {
  const files = [];

  // ── Commands ───────────────────────────────────────────────────────
  files.push(
    { template: 'commands/plan-session.md.template', output: '.claude/commands/plan-session.md', description: 'Plan session command' },
    { template: 'commands/start-session.md.template', output: '.claude/commands/start-session.md', description: 'Start session command' },
    { template: 'commands/end-session.md.template', output: '.claude/commands/end-session.md', description: 'End session command' },
    { template: 'commands/verify.md.template', output: '.claude/commands/verify.md', description: 'Verify command' },
    { template: 'commands/new-feature.md.template', output: '.claude/commands/new-feature.md', description: 'New feature command' },
    { template: 'commands/new-worktree.md.template', output: '.claude/commands/new-worktree.md', description: 'Worktree command' },
    { template: 'commands/explore-project.md.template', output: '.claude/commands/explore-project.md', description: 'Explore project command' },
  );

  // Pivot session (conditional on template existence)
  const pivotTemplate = resolve(templatesRoot, 'commands/pivot-session.md.template');
  if (existsSync(pivotTemplate)) {
    files.push(
      { template: 'commands/pivot-session.md.template', output: '.claude/commands/pivot-session.md', description: 'Pivot session command' },
    );
  }

  // Init command (for AI-powered content population)
  const initTemplate = resolve(templatesRoot, 'commands/init.md.template');
  if (existsSync(initTemplate)) {
    files.push(
      { template: 'commands/init.md.template', output: '.claude/commands/init.md', description: 'Init command (AI content)' },
    );
  }

  // ── Renderable docs (use only config/detection variables) ──────────
  files.push(
    { template: 'docs/WORKFLOW.md.template', output: 'docs_specflow/WORKFLOW.md', description: 'Tech workflow' },
    { template: 'docs/SESSION_LOG.md.template', output: 'docs_specflow/SESSION_LOG.md', description: 'Session journal' },
    { template: 'docs/LEARNED_PATTERNS.md.template', output: 'docs_specflow/LEARNED_PATTERNS.md', description: 'Discovered patterns' },
  );

  // ── Technical layers: Hooks ─────────────────────────────────────────
  if (config.ENABLE_HOOKS) {
    files.push(
      { template: 'hooks/session-start-context.js.template', output: '.claude/hooks/session-start-context.js', description: 'Hook: auto-load context' },
      { template: 'hooks/doc-file-blocker.js.template', output: '.claude/hooks/doc-file-blocker.js', description: 'Hook: block frozen docs' },
      { template: 'hooks/auto-format.js.template', output: '.claude/hooks/auto-format.js', description: 'Hook: auto-format code' },
      { template: 'hooks/compact-suggester.js.template', output: '.claude/hooks/compact-suggester.js', description: 'Hook: suggest /compact' },
      { template: 'hooks/git-push-reminder.js.template', output: '.claude/hooks/git-push-reminder.js', description: 'Hook: git push reminder' },
      { template: 'hooks/session-end-persist.js.template', output: '.claude/hooks/session-end-persist.js', description: 'Hook: session state' },
      { template: 'hooks/continuous-learning.js.template', output: '.claude/hooks/continuous-learning.js', description: 'Hook: learning reminder' },
    );
  }

  // ── Technical layers: Rules ─────────────────────────────────────────
  if (config.ENABLE_RULES) {
    files.push(
      { template: 'rules/coding-style.md.template', output: '.claude/rules/coding-style.md', description: 'Rule: coding style' },
      { template: 'rules/git-workflow.md.template', output: '.claude/rules/git-workflow.md', description: 'Rule: git workflow' },
      { template: 'rules/security.md.template', output: '.claude/rules/security.md', description: 'Rule: security' },
      { template: 'rules/testing.md.template', output: '.claude/rules/testing.md', description: 'Rule: testing' },
      { template: 'rules/documentation.md.template', output: '.claude/rules/documentation.md', description: 'Rule: documentation' },
    );
  }

  // ── Technical layers: Statusline ────────────────────────────────────
  if (config.ENABLE_STATUSLINE) {
    files.push(
      { template: 'settings/statusline.js.template', output: '.claude/statusline.js', description: 'Statusline display' },
    );
  }

  // ── Agents: always generate all 8 agents ────────────────────────────
  // All agents are generated by default (harmless if unused).
  // /init can later advise which agents are relevant for the detected stack.
  const allAgents = [
    'base', 'qa', 'architecture', 'backend', 'frontend',
    'build-error-resolver', 'security-reviewer', 'refactor-cleaner',
  ];
  for (const agent of allAgents) {
    files.push({
      template: `agents/${agent}.md.template`,
      output: `.claude/agents/${agent}.md`,
      description: `Agent: ${agent}`,
    });
  }

  return files;
}

/**
 * Build the full list of files to generate (used by `specflow-ai update`).
 * Includes ALL files — both structural and doc templates.
 *
 * @param {string} templatesRoot - Path to the templates directory
 * @param {Record<string, unknown>} config - User configuration
 * @returns {Array<{template: string, output: string, description: string}>}
 */
export function buildFileManifest(templatesRoot, config) {
  const files = [];

  // ── Always generate: Documentation ────────────────────────────────
  files.push(
    { template: 'CLAUDE.md.template', output: 'CLAUDE.md', description: 'AI context file' },
    { template: 'docs/ROADMAP.md.template', output: 'docs_specflow/ROADMAP.md', description: 'Task roadmap' },
    { template: 'docs/SESSION_LOG.md.template', output: 'docs_specflow/SESSION_LOG.md', description: 'Session journal' },
    { template: 'docs/WORKFLOW.md.template', output: 'docs_specflow/WORKFLOW.md', description: 'Tech workflow' },
    { template: 'docs/VISION.md.template', output: 'docs_specflow/VISION.md', description: 'Product vision' },
    { template: 'docs/OVERVIEW.md.template', output: 'docs_specflow/OVERVIEW.md', description: 'System architecture' },
    { template: 'docs/ADR.md.template', output: 'docs_specflow/ADR.md', description: 'Architecture decisions' },
    { template: 'docs/LEARNED_PATTERNS.md.template', output: 'docs_specflow/LEARNED_PATTERNS.md', description: 'Discovered patterns' },
  );

  // ── Always generate: Commands ─────────────────────────────────────
  files.push(
    { template: 'commands/plan-session.md.template', output: '.claude/commands/plan-session.md', description: 'Plan session command' },
    { template: 'commands/start-session.md.template', output: '.claude/commands/start-session.md', description: 'Start session command' },
    { template: 'commands/end-session.md.template', output: '.claude/commands/end-session.md', description: 'End session command' },
    { template: 'commands/verify.md.template', output: '.claude/commands/verify.md', description: 'Verify command' },
    { template: 'commands/new-feature.md.template', output: '.claude/commands/new-feature.md', description: 'New feature command' },
    { template: 'commands/new-worktree.md.template', output: '.claude/commands/new-worktree.md', description: 'Worktree command' },
    { template: 'commands/explore-project.md.template', output: '.claude/commands/explore-project.md', description: 'Explore project command' },
  );

  // ── Conditional: Pivot session ────────────────────────────────────
  const pivotTemplate = resolve(templatesRoot, 'commands/pivot-session.md.template');
  if (existsSync(pivotTemplate)) {
    files.push(
      { template: 'commands/pivot-session.md.template', output: '.claude/commands/pivot-session.md', description: 'Pivot session command' },
    );
  }

  // ── Technical layers: Hooks ───────────────────────────────────────
  if (config.ENABLE_HOOKS) {
    files.push(
      { template: 'hooks/session-start-context.js.template', output: '.claude/hooks/session-start-context.js', description: 'Hook: auto-load context' },
      { template: 'hooks/doc-file-blocker.js.template', output: '.claude/hooks/doc-file-blocker.js', description: 'Hook: block frozen docs' },
      { template: 'hooks/auto-format.js.template', output: '.claude/hooks/auto-format.js', description: 'Hook: auto-format code' },
      { template: 'hooks/compact-suggester.js.template', output: '.claude/hooks/compact-suggester.js', description: 'Hook: suggest /compact' },
      { template: 'hooks/git-push-reminder.js.template', output: '.claude/hooks/git-push-reminder.js', description: 'Hook: git push reminder' },
      { template: 'hooks/session-end-persist.js.template', output: '.claude/hooks/session-end-persist.js', description: 'Hook: session state' },
      { template: 'hooks/continuous-learning.js.template', output: '.claude/hooks/continuous-learning.js', description: 'Hook: learning reminder' },
    );
  }

  // ── Technical layers: Rules ───────────────────────────────────────
  if (config.ENABLE_RULES) {
    files.push(
      { template: 'rules/coding-style.md.template', output: '.claude/rules/coding-style.md', description: 'Rule: coding style' },
      { template: 'rules/git-workflow.md.template', output: '.claude/rules/git-workflow.md', description: 'Rule: git workflow' },
      { template: 'rules/security.md.template', output: '.claude/rules/security.md', description: 'Rule: security' },
      { template: 'rules/testing.md.template', output: '.claude/rules/testing.md', description: 'Rule: testing' },
      { template: 'rules/documentation.md.template', output: '.claude/rules/documentation.md', description: 'Rule: documentation' },
    );
  }

  // ── Technical layers: Statusline ──────────────────────────────────
  if (config.ENABLE_STATUSLINE) {
    files.push(
      { template: 'settings/statusline.js.template', output: '.claude/statusline.js', description: 'Statusline display' },
    );
  }

  // ── Agents: always generate all 8 agents ─────────────────────────
  const allAgents = [
    'base', 'qa', 'architecture', 'backend', 'frontend',
    'build-error-resolver', 'security-reviewer', 'refactor-cleaner',
  ];
  for (const agent of allAgents) {
    files.push({
      template: `agents/${agent}.md.template`,
      output: `.claude/agents/${agent}.md`,
      description: `Agent: ${agent}`,
    });
  }

  return files;
}

/**
 * Generate all files from templates.
 *
 * @param {string} projectDir - Target project directory
 * @param {string} templatesRoot - Path to templates
 * @param {Array<{template: string, output: string, description: string}>} manifest - Files to generate
 * @param {Record<string, unknown>} context - Template variables
 * @param {object} options - { dryRun: boolean, overwrite: boolean }
 * @returns {{ created: string[], skipped: string[] }}
 */
export function generateFiles(projectDir, templatesRoot, manifest, context, options = {}) {
  const created = [];
  const skipped = [];

  for (const entry of manifest) {
    const templatePath = resolve(templatesRoot, entry.template);
    const outputPath = resolve(projectDir, entry.output);

    // Skip if template doesn't exist
    if (!existsSync(templatePath)) {
      console.log(chalk.yellow(`  skip  ${entry.output} (template not found)`));
      skipped.push(entry.output);
      continue;
    }

    // Skip if output exists and we're not overwriting
    if (!options.overwrite && existsSync(outputPath)) {
      console.log(chalk.yellow(`  skip  ${entry.output} (already exists)`));
      skipped.push(entry.output);
      continue;
    }

    if (options.dryRun) {
      console.log(chalk.blue(`  would create  ${entry.output}`));
      created.push(entry.output);
      continue;
    }

    // Ensure directory exists
    mkdirSync(dirname(outputPath), { recursive: true });

    // Render and write
    const content = renderTemplate(templatePath, context);
    writeFileSync(outputPath, content, 'utf-8');
    console.log(chalk.green(`  create  ${entry.output}`));
    created.push(entry.output);
  }

  return { created, skipped };
}

/**
 * Generate skeleton documentation files that need AI content.
 * These are static markdown (not Handlebars-rendered) with TODO markers.
 * The /init command will populate them with AI-analyzed content.
 *
 * @param {string} projectDir - Target project directory
 * @param {Record<string, unknown>} config - Configuration values
 * @param {object} options - { dryRun: boolean, overwrite: boolean }
 * @returns {{ created: string[], skipped: string[] }}
 */
export function generateSkeletonDocs(projectDir, config, options = {}) {
  const created = [];
  const skipped = [];

  const skeletons = [
    {
      output: 'docs_specflow/OVERVIEW.md',
      description: 'System architecture',
      content: `# System Overview

> Living document describing what the system is *now*.
> Run \`/init\` to populate this from codebase analysis.

## 1. What This Product Does

<!-- TODO: /init will populate from codebase scan or PRD -->

## 2. Core User Journeys

<!-- TODO: /init will populate -->
- **UJ1**: TODO - Define first user journey
- **UJ2**: TODO - Define second user journey

## 3. Architecture at 10,000 ft

### Backend

- **Stack**: ${config.TECH_STACK || 'TODO'}
- **Structure**:
  \`\`\`
  TODO: /init will populate directory structure
  \`\`\`
- **Main modules**: TODO

### Frontend

- Not applicable (API-only / CLI / etc.)

### Data

- **Primary database**: TODO
- **Key entities**: TODO

### Integrations

- None yet

## 4. External Contracts

### API

- TODO: Link to API specification

### Events

- Not applicable / TODO

### Data

- TODO: Link to database schema / migrations

## 5. Invariants

> Rules that must always hold. Breaking these requires an ADR entry.

<!-- Examples:
- Every entity must have an owner
- IDs are immutable once created
- All API endpoints require authentication
-->
- TODO: Define system invariants
`,
    },
    {
      output: 'docs_specflow/VISION.md',
      description: 'Product vision',
      content: `# Project Vision

> Run \`/init\` to populate this from project context.

## 1. Problem Statement

<!-- TODO: /init will populate -->

## 2. Solution Hypothesis

<!-- TODO: /init will populate -->

## 3. Target Users

<!-- TODO: /init will populate -->

## 4. Success Metrics

<!-- Define qualitative or quantitative indicators of success. No invented numbers. -->
- TODO: Define success metrics

## 5. Non-Goals

<!-- Clarify what is explicitly out of scope. -->
- TODO: Define non-goals

## 6. Tech Stack

- **Stack**: ${config.TECH_STACK || 'TODO'}

## 7. Pivot History

- ${config.DATE} - Initial concept defined

<!-- Append new entries when direction changes significantly -->
`,
    },
    {
      output: 'docs_specflow/ROADMAP.md',
      description: 'Task roadmap',
      content: `# Roadmap

**Last Updated**: ${config.DATE}
**Current Phase**: <!-- TODO: /init will populate -->

## Now (Current Work)

<!-- Tag each task with [feature: name] -->
<!-- TODO: /init will populate initial tasks -->

## Next (Queued)

<!-- Priority ordered - top item is next -->
<!-- Tag each task with [feature: name] -->

1. TODO: Define next priority [feature: feature-name]
2. TODO: Define following priority [feature: feature-name]

## Later (Backlog)

<!-- Ideas and future work, not prioritized -->

- TODO: Add backlog items as they emerge

## Done (Recent)

<!-- Recently completed, for context -->

- None yet (fresh project)

## Blockers

<!-- Anything preventing progress -->

- None

---

## Notes

- Tasks should be small enough to complete in 1-2 sessions
- Move items between sections as priorities change
- Add blockers immediately when encountered
- Reference tasks by ID in SESSION_LOG entries
- **Feature tagging**: Every task must be tagged with \`[feature: name]\`
  - Example: \`- [ ] Add login endpoint [feature: user-auth]\`
  - Use \`[feature: infrastructure]\` for project-wide work (upgrades, refactors, etc.)
  - AI agents use feature tags to filter tasks when planning sessions
`,
    },
    {
      output: 'docs_specflow/ADR.md',
      description: 'Architecture decisions',
      content: `# Architecture Decision Record

> Append-only log of significant architecture and design decisions.
> Never modify existing entries - only append new ones.
> Run \`/init\` to populate ADR-0001 with your tech stack.

## ADR-0001: Initial Architecture and Tech Stack

- **Date**: ${config.DATE}
- **Status**: Accepted

### Context

Project initialized with SpecFlow. Need to establish baseline architecture.

### Decision

- **Stack**: ${config.TECH_STACK || 'TODO: /init will populate'}

### Consequences

- Establishes baseline stack for all future work
- Team should have familiarity with chosen technologies
- Future ADRs will build on this foundation

### Related

- \`VISION.md\`
- \`OVERVIEW.md\`

---

<!--
## ADR-XXXX: [Decision Title]

- **Date**: YYYY-MM-DD
- **Status**: Proposed / Accepted / Deprecated / Superseded by ADR-XXXX

### Context

[Why this decision is needed]

### Decision

[What was decided]

### Consequences

[What this means for the project]

### Related

[Links to related docs, code, or ADRs]

---
-->

<!-- New ADRs must be appended below this line. Do not modify existing entries. -->
`,
    },
    {
      output: 'docs_specflow/CUSTOM.md',
      description: 'Project-specific context',
      content: `# Project-Specific Context

> Custom instructions and context that extend SpecFlow's defaults. All commands read this file.
> Add project-specific details here that the framework can't anticipate.

---

## External References

<!-- Link external repositories or resources this project depends on -->

- None yet

---

## Custom Commands

<!-- Project-specific commands not covered by standard test/build/lint -->

\`\`\`bash
# Example: Custom deployment
# ./deploy.sh staging
\`\`\`

---

## Project Conventions

<!-- Patterns specific to this project that AI should follow -->

- None yet

---

## Known Gotchas

<!-- Common pitfalls or non-obvious behaviors -->

- None yet

---

## AI Guidelines

<!-- How you want AI to behave in this project -->

- Follow the conventions documented above
- When uncertain, ask rather than guess
`,
    },
  ];

  for (const skeleton of skeletons) {
    const outputPath = resolve(projectDir, skeleton.output);

    if (!options.overwrite && existsSync(outputPath)) {
      console.log(chalk.yellow(`  skip  ${skeleton.output} (already exists)`));
      skipped.push(skeleton.output);
      continue;
    }

    if (options.dryRun) {
      console.log(chalk.blue(`  would create  ${skeleton.output}`));
      created.push(skeleton.output);
      continue;
    }

    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, skeleton.content, 'utf-8');
    console.log(chalk.green(`  create  ${skeleton.output}`));
    created.push(skeleton.output);
  }

  return { created, skipped };
}

/**
 * Generate skeleton CLAUDE.md with config values filled in, AI sections as TODOs.
 *
 * @param {string} projectDir - Target project directory
 * @param {Record<string, unknown>} config - Configuration values
 * @param {object} options - { dryRun: boolean, overwrite: boolean, append: boolean }
 * @returns {{ created: boolean, skipped: boolean }}
 */
export function generateSkeletonClaudeMd(projectDir, config, options = {}) {
  const outputPath = resolve(projectDir, 'CLAUDE.md');

  if (!options.overwrite && existsSync(outputPath)) {
    console.log(chalk.yellow(`  skip  CLAUDE.md (already exists)`));
    return { created: false, skipped: true };
  }

  if (options.dryRun) {
    console.log(chalk.blue(`  would create  CLAUDE.md`));
    return { created: true, skipped: false };
  }

  // Build git workflow section
  let gitWorkflowSection = '';
  if (config.GIT_WORKFLOW === 'solo') {
    gitWorkflowSection = `- Work on feature branches
- Merge directly to main when tests pass`;
  } else if (config.GIT_WORKFLOW === 'pr-review') {
    gitWorkflowSection = `- Work on feature branches
- Create PR for review (don't merge directly)
- Use \`/end-session\` to create PR`;
  } else if (config.GIT_WORKFLOW === 'ci-cd-gated') {
    gitWorkflowSection = `- Work on feature branches
- Create MR and let CI/CD handle merge
- Do not merge locally`;
  }

  // Build agents table — all 8 agents always listed
  const agentRows = [
    `| \`base.md\` | Shared principles and session ritual | ${config.AGENT_MODEL_BASE || 'sonnet'} |`,
    `| \`qa.md\` | Test writing and quality assurance | ${config.AGENT_MODEL_QA || 'sonnet'} |`,
    `| \`architecture.md\` | Architecture review and system design (advisory, read-only) | ${config.AGENT_MODEL_ARCHITECTURE || 'opus'} |`,
    `| \`backend.md\` | Backend implementation patterns | ${config.AGENT_MODEL_BACKEND || 'sonnet'} |`,
    `| \`frontend.md\` | Frontend implementation patterns | ${config.AGENT_MODEL_FRONTEND || 'sonnet'} |`,
    `| \`build-error-resolver.md\` | Build failures, type errors, dependency issues | ${config.AGENT_MODEL_BUILD_ERROR || 'sonnet'} |`,
    `| \`security-reviewer.md\` | Security auditing, OWASP review (advisory, read-only) | ${config.AGENT_MODEL_SECURITY || 'opus'} |`,
    `| \`refactor-cleaner.md\` | Dead code removal, complexity reduction | ${config.AGENT_MODEL_REFACTOR || 'sonnet'} |`,
  ];

  // Build technical enforcement section
  let techSection = '';
  if (config.TECHNICAL_LAYERS) {
    techSection = `## Technical Enforcement

### Hooks (\`.claude/hooks/\`)
Automated behaviors at session lifecycle points:
- **SessionStart**: Auto-loads ROADMAP, SESSION_LOG, and feature SPEC into context
- **PreToolUse**: Blocks edits to frozen docs (VISION.md, SPEC.md requirements)
- **PostToolUse**: Auto-formats code after edits, suggests /compact at high context usage, reminds to capture learned patterns
- **Stop**: Reminds to push unpushed commits
- **SessionEnd**: Saves session state snapshot for continuity

### Rules (\`.claude/rules/\`)
Always-loaded coding guidelines:
- \`coding-style.md\` — Language-specific style and patterns
- \`git-workflow.md\` — Branch, commit, and merge conventions
- \`security.md\` — Secret protection and secure coding
- \`testing.md\` — Test commands and quality standards
- \`documentation.md\` — SpecFlow documentation conventions

### Statusline
Real-time display: context usage %, current feature, TODO progress, git status.

`;
  }

  const content = `# ${config.PROJECT_NAME}

> This file provides context for AI assistants working on this project.

## Project Overview

${config.PROJECT_DESCRIPTION || 'TODO: Run /init to populate from codebase analysis'}

## Quick Context

- **Type**: ${config.PROJECT_TYPE} (greenfield / constrained / adoption)
- **Stack**: ${config.TECH_STACK || 'Unknown'}
- **Git Workflow**: ${config.GIT_WORKFLOW} (solo / pr-review / ci-cd-gated)

## Documentation

Read these before making changes:

| Priority | Document | Purpose |
|----------|----------|---------|
| 1 | [ROADMAP.md](docs_specflow/ROADMAP.md) | Current tasks and priorities |
| 2 | [SESSION_LOG.md](docs_specflow/SESSION_LOG.md) | Recent session history |
| 3 | [OVERVIEW.md](docs_specflow/OVERVIEW.md) | System architecture |
| 4 | [ADR.md](docs_specflow/ADR.md) | Architecture decisions |
| 5 | [VISION.md](docs_specflow/VISION.md) | Product direction |
| 6 | [LEARNED_PATTERNS.md](docs_specflow/LEARNED_PATTERNS.md) | Discovered patterns and conventions |

> **LEARNED_PATTERNS.md**: Append codebase patterns, anti-patterns, and conventions you discover during sessions. The continuous-learning hook will periodically remind you to capture insights. Check this file at session start to avoid re-discovering known patterns.

## Session Commands

Use these commands to structure your work:

- \`/init\` - Populate documentation with AI-analyzed content (run once after setup)
- \`/plan-session\` - Prepare for implementation
- \`/start-session\` - Begin coding
- \`/end-session\` - Wrap up and merge
- \`/verify\` - Validate docs consistency and project health

Commands are in \`.claude/commands/\`.

${techSection}## Agents

Role-specific agents in \`.claude/agents/\` provide specialized behavior:

| Agent | Role | Model Tier |
|-------|------|------------|
${agentRows.join('\n')}

Advisory agents (architecture, security-reviewer) have read/search access only — they report findings but don't modify code.

## Key Patterns

<!-- TODO: Run /init to populate from codebase analysis -->

## Invariants

These rules must always hold:

<!-- TODO: Run /init to populate from codebase analysis -->

## Git Workflow

${gitWorkflowSection}

## Working Agreements

1. **One task per session** - Don't mix unrelated changes
2. **Update docs** - SESSION_LOG.md after every session, ROADMAP.md when tasks change
3. **Ask when unclear** - Don't invent requirements
4. **No manual metrics** - Automated or nothing

## Getting Started

1. Run \`/init\` to populate documentation from codebase analysis
2. Run \`/plan-session\` to see current priorities
3. Pick ONE task from ROADMAP.md
4. Run \`/start-session\` to begin
5. When done, run \`/end-session\`

---

*This project uses [SpecFlow](https://github.com/jurebordon/specflow) for AI-assisted development.*
`;

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, content, 'utf-8');
  console.log(chalk.green(`  create  CLAUDE.md`));
  return { created: true, skipped: false };
}

/**
 * Generate the .specflow-config.md file.
 *
 * @param {string} projectDir - Target project directory
 * @param {Record<string, unknown>} config - Configuration values
 * @param {object} options - { dryRun: boolean, overwrite: boolean }
 */
export function generateConfig(projectDir, config, options = {}) {
  const outputPath = resolve(projectDir, 'docs_specflow/.specflow-config.md');

  if (!options.overwrite && existsSync(outputPath)) {
    console.log(chalk.yellow(`  skip  docs_specflow/.specflow-config.md (already exists)`));
    return;
  }

  if (options.dryRun) {
    console.log(chalk.blue(`  would create  docs_specflow/.specflow-config.md`));
    return;
  }

  mkdirSync(dirname(outputPath), { recursive: true });

  const content = `# SpecFlow Project Configuration

## Project
- **Name**: ${config.PROJECT_NAME}
- **Mode**: ${config.PROJECT_TYPE}
- **Description**: ${config.PROJECT_DESCRIPTION}

## Tech Stack
- **Languages**: ${config.TECH_STACK || ''}
- **Test Command**: ${config.TEST_COMMAND || ''}
- **Build Command**: ${config.BUILD_COMMAND || ''}
- **Lint Command**: ${config.LINT_COMMAND || ''}

## Git Workflow
- **Type**: ${config.GIT_WORKFLOW}
- **Platform**: ${config.GIT_PLATFORM}
- **Default Branch**: ${config.DEFAULT_BRANCH}
- **Branch Convention**: ${config.BRANCH_CONVENTION}

## Integrations
- **Ticketing**: ${config.TICKETING}${config.TICKET_FORMAT ? ` (format: ${config.TICKET_FORMAT})` : ''}

## Documentation
- **Path**: ${config.DOCS_PATH || 'docs_specflow'}
- **Existing Docs**: ${config.EXISTING_DOCS_PATH || ''}
- **Tracking**: ${config.DOCS_GITIGNORED ? 'gitignored' : 'tracked'}

## Technical Layers
- **Hooks**: ${config.ENABLE_HOOKS ? 'enabled' : 'disabled'}
- **Rules**: ${config.ENABLE_RULES ? 'enabled' : 'disabled'}
- **Statusline**: ${config.ENABLE_STATUSLINE ? 'enabled' : 'disabled'}
- **Format Command**: ${config.FORMAT_COMMAND || ''}
- **Typecheck Command**: ${config.TYPECHECK_COMMAND || ''}
`;

  writeFileSync(outputPath, content, 'utf-8');
  console.log(chalk.green(`  create  docs_specflow/.specflow-config.md`));
}

/**
 * Generate or merge settings.json for hooks and statusline.
 *
 * @param {string} projectDir - Target project directory
 * @param {string} templatesRoot - Path to templates
 * @param {Record<string, unknown>} config - Configuration values
 * @param {object} options - { dryRun: boolean }
 */
export function generateSettings(projectDir, templatesRoot, config, options = {}) {
  const settingsPath = resolve(projectDir, '.claude/settings.json');
  let settings = {};

  // Load existing settings if present
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
    } catch {
      // If parse fails, start fresh
    }
  }

  // Merge hooks config
  if (config.ENABLE_HOOKS) {
    const hooksTemplatePath = resolve(templatesRoot, 'settings/hooks.json.template');
    if (existsSync(hooksTemplatePath)) {
      const rendered = renderTemplate(hooksTemplatePath, config);
      try {
        const hooksConfig = JSON.parse(rendered);
        settings.hooks = hooksConfig.hooks;
      } catch {
        console.log(chalk.yellow(`  warn  Could not parse hooks config template`));
      }
    }
  }

  // Add statusline config
  if (config.ENABLE_STATUSLINE) {
    settings.statusLine = { command: 'node .claude/statusline.js' };
  }

  if (Object.keys(settings).length === 0) {
    return;
  }

  if (options.dryRun) {
    console.log(chalk.blue(`  would create  .claude/settings.json`));
    return;
  }

  mkdirSync(dirname(settingsPath), { recursive: true });
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
  console.log(chalk.green(`  create  .claude/settings.json`));
}

/**
 * Add docs_specflow/ to .gitignore if needed.
 *
 * @param {string} projectDir - Target project directory
 * @param {Record<string, unknown>} config - Configuration values
 * @param {object} options - { dryRun: boolean }
 */
export function updateGitignore(projectDir, config, options = {}) {
  if (!config.DOCS_GITIGNORED) {
    return;
  }

  const gitignorePath = resolve(projectDir, '.gitignore');
  let content = '';

  if (existsSync(gitignorePath)) {
    content = readFileSync(gitignorePath, 'utf-8');
    if (content.includes('docs_specflow/')) {
      return; // Already ignored
    }
  }

  if (options.dryRun) {
    console.log(chalk.blue(`  would update  .gitignore (add docs_specflow/)`));
    return;
  }

  const addition = '\n# SpecFlow documentation (personal)\ndocs_specflow/\n';
  writeFileSync(gitignorePath, content + addition, 'utf-8');
  console.log(chalk.green(`  update  .gitignore (added docs_specflow/)`));
}
