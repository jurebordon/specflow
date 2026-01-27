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
 * Build the list of files to generate based on config.
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

  // ── Agents: always generate core agents ───────────────────────────
  const coreAgents = ['base', 'qa', 'architecture', 'backend', 'frontend'];
  for (const agent of coreAgents) {
    files.push({
      template: `agents/${agent}.md.template`,
      output: `.claude/agents/${agent}.md`,
      description: `Agent: ${agent}`,
    });
  }

  // ── Agents: specialist agents based on user selection ─────────────
  const specialistAgents = ['build-error-resolver', 'security-reviewer', 'refactor-cleaner'];
  for (const agent of specialistAgents) {
    if (config.AGENT_ROLES && config.AGENT_ROLES.includes(agent)) {
      files.push({
        template: `agents/${agent}.md.template`,
        output: `.claude/agents/${agent}.md`,
        description: `Agent: ${agent}`,
      });
    }
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
- **Path**: docs_specflow/
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
