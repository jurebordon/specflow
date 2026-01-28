import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';
import chalk from 'chalk';
import { confirm } from '@inquirer/prompts';
import { detectTechStack } from './detect.js';
import { getTemplatesRoot, buildFileManifest, generateFiles, generateSettings } from './generate.js';
import { deriveGitVariables } from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliRoot = resolve(__dirname, '..');

/**
 * Update command: re-renders commands, hooks, rules, agents, and statusline
 * without touching docs or config.
 */
export async function update() {
  const projectDir = process.cwd();

  console.log('');
  console.log(chalk.bold('SpecFlow Update'));
  console.log(chalk.dim('Re-generate commands, hooks, rules, and agents from latest templates'));
  console.log('');

  // ── Verify SpecFlow is initialized ────────────────────────────────
  const configPath = resolve(projectDir, 'docs_specflow/.specflow-config.md');
  if (!existsSync(configPath)) {
    console.log(chalk.red('Error: This project has not been initialized with SpecFlow.'));
    console.log(chalk.red('Run `specflow init` first.'));
    process.exit(1);
  }

  // ── Parse existing config to get settings ─────────────────────────
  const config = parseConfigFile(configPath);

  // Detect tech stack for boolean flags
  const detection = detectTechStack(projectDir);
  Object.assign(config, detection.booleanFlags);
  config.MIXED_STACK = detection.detected.length > 1;
  config.DATE = new Date().toISOString().split('T')[0];
  config.CURRENT_DATE = config.DATE;

  // Derive GIT_WORKFLOW booleans and template variables
  deriveGitVariables(config);

  // ── Build manifest of updatable files ─────────────────────────────
  const templatesRoot = getTemplatesRoot(cliRoot);

  if (!existsSync(templatesRoot)) {
    console.log(chalk.red('Error: Templates not found.'));
    process.exit(1);
  }

  const fullManifest = buildFileManifest(templatesRoot, config);

  // Filter to only updatable files (commands, hooks, rules, agents, statusline, settings)
  // Exclude docs and CLAUDE.md — those belong to the user
  const updatableManifest = fullManifest.filter(entry =>
    entry.output.startsWith('.claude/') && !entry.output.endsWith('settings.json')
  );

  console.log(chalk.bold(`Files to update: ${updatableManifest.length}`));
  console.log(chalk.dim('  (commands, hooks, rules, agents, statusline)'));
  console.log(chalk.dim('  Docs and config are NOT modified.'));
  console.log('');

  const proceed = await confirm({
    message: 'Proceed? This will overwrite existing commands, hooks, rules, and agents.',
    default: true,
  });

  if (!proceed) {
    console.log(chalk.dim('Update cancelled.'));
    return;
  }

  console.log('');
  console.log(chalk.bold('Updating files...'));
  console.log('');

  const { created } = generateFiles(
    projectDir,
    templatesRoot,
    updatableManifest,
    config,
    { overwrite: true },
  );

  // Re-generate settings.json
  generateSettings(projectDir, templatesRoot, config);

  console.log('');
  console.log(chalk.bold.green('Update complete!'));
  console.log(`  Updated ${created.length} files`);
  console.log('');
}

/**
 * Parse .specflow-config.md to extract config values.
 * Simple key-value extraction from markdown list items.
 *
 * @param {string} configPath - Path to .specflow-config.md
 * @returns {Record<string, unknown>}
 */
function parseConfigFile(configPath) {
  const content = readFileSync(configPath, 'utf-8');
  const config = {};

  const fieldMap = {
    'Name': 'PROJECT_NAME',
    'Mode': 'PROJECT_TYPE',
    'Description': 'PROJECT_DESCRIPTION',
    'Languages': 'TECH_STACK',
    'Test Command': 'TEST_COMMAND',
    'Build Command': 'BUILD_COMMAND',
    'Lint Command': 'LINT_COMMAND',
    'Format Command': 'FORMAT_COMMAND',
    'Typecheck Command': 'TYPECHECK_COMMAND',
    'Type': 'GIT_WORKFLOW',
    'Platform': 'GIT_PLATFORM',
    'Default Branch': 'DEFAULT_BRANCH',
    'Branch Convention': 'BRANCH_CONVENTION',
    'Ticketing': 'TICKETING',
    'Path': 'DOCS_PATH',
    'Existing Docs': 'EXISTING_DOCS_PATH',
  };

  for (const line of content.split('\n')) {
    const match = line.match(/^- \*\*(.+?)\*\*:\s*(.+)$/);
    if (match) {
      const label = match[1].trim();
      const value = match[2].trim();
      const varName = fieldMap[label];
      if (varName) {
        config[varName] = value;
      }

      // Special handling for layer toggles
      if (label === 'Hooks') config.ENABLE_HOOKS = value === 'enabled';
      if (label === 'Rules') config.ENABLE_RULES = value === 'enabled';
      if (label === 'Statusline') config.ENABLE_STATUSLINE = value === 'enabled';
      if (label === 'Tracking') config.DOCS_GITIGNORED = value === 'gitignored';
    }
  }

  config.TECHNICAL_LAYERS = config.ENABLE_HOOKS || config.ENABLE_RULES || config.ENABLE_STATUSLINE;

  // Default agent config (update doesn't change agent roles)
  config.AGENT_ROLES = ['backend', 'frontend', 'qa', 'architecture', 'build-error-resolver', 'security-reviewer', 'refactor-cleaner'];
  config.AGENT_MODEL_BASE = 'sonnet';
  config.AGENT_MODEL_QA = 'sonnet';
  config.AGENT_MODEL_ARCHITECTURE = 'opus';
  config.AGENT_MODEL_BACKEND = 'sonnet';
  config.AGENT_MODEL_FRONTEND = 'sonnet';
  config.AGENT_MODEL_BUILD_ERROR = 'sonnet';
  config.AGENT_MODEL_SECURITY = 'opus';
  config.AGENT_MODEL_REFACTOR = 'sonnet';

  return config;
}
