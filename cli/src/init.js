import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import chalk from 'chalk';
import { confirm } from '@inquirer/prompts';
import { askSetupQuestions, getDefaults } from './questions.js';
import { detectTechStack } from './detect.js';
import {
  getTemplatesRoot,
  buildFileManifest,
  generateFiles,
  generateConfig,
  generateSettings,
  updateGitignore,
} from './generate.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliRoot = resolve(__dirname, '..');

/**
 * Main init command handler.
 *
 * @param {object} options - Commander options (--yes, --mode)
 */
export async function init(options) {
  const projectDir = process.cwd();

  console.log('');
  console.log(chalk.bold('SpecFlow Init'));
  console.log(chalk.dim('Spec-driven framework for AI-assisted development'));
  console.log('');

  // ── Check for existing SpecFlow ───────────────────────────────────
  if (existsSync(resolve(projectDir, 'docs_specflow/.specflow-config.md'))) {
    console.log(chalk.yellow('This project already has SpecFlow initialized.'));
    console.log(chalk.yellow('Use `specflow update` to update templates, or delete docs_specflow/.specflow-config.md to re-init.'));
    console.log('');
    return;
  }

  // ── Gather configuration ──────────────────────────────────────────
  let config;
  if (options.yes) {
    config = getDefaults();
    console.log(chalk.dim('Using default configuration (--yes)'));
    console.log('');
  } else {
    config = await askSetupQuestions(options);
    console.log('');
  }

  // ── Tech stack detection ──────────────────────────────────────────
  if (config.SCAN_TECH_STACK) {
    console.log(chalk.dim('Scanning project for tech stack...'));
    const detection = detectTechStack(projectDir);

    if (detection.detected.length > 0) {
      console.log(chalk.green(`Detected: ${detection.techStack}`));
    } else {
      console.log(chalk.yellow('No tech stack detected.'));
    }

    config.TECH_STACK = config.TECH_STACK || detection.techStack;
    config.TEST_COMMAND = detection.commands.TEST_COMMAND;
    config.BUILD_COMMAND = detection.commands.BUILD_COMMAND;
    config.LINT_COMMAND = detection.commands.LINT_COMMAND;
    config.FORMAT_COMMAND = detection.commands.FORMAT_COMMAND;
    config.TYPECHECK_COMMAND = detection.commands.TYPECHECK_COMMAND;

    // Set boolean flags for conditional template blocks
    Object.assign(config, detection.booleanFlags);

    config.MIXED_STACK = detection.detected.length > 1;
    console.log('');
  }

  // Ensure commands have fallback values
  config.TEST_COMMAND = config.TEST_COMMAND || '# No test command configured';
  config.BUILD_COMMAND = config.BUILD_COMMAND || '# No build command configured';
  config.LINT_COMMAND = config.LINT_COMMAND || '# No lint command configured';
  config.FORMAT_COMMAND = config.FORMAT_COMMAND || '# No format command configured';
  config.TYPECHECK_COMMAND = config.TYPECHECK_COMMAND || '# No type check command configured';

  // ── Build file manifest ───────────────────────────────────────────
  const templatesRoot = getTemplatesRoot(cliRoot);

  if (!existsSync(templatesRoot)) {
    console.log(chalk.red('Error: Templates not found.'));
    console.log(chalk.red(`Expected at: ${templatesRoot}`));
    console.log(chalk.red('If running from source, ensure you are in the specflow repo.'));
    process.exit(1);
  }

  const manifest = buildFileManifest(templatesRoot, config);

  // ── Show summary ──────────────────────────────────────────────────
  console.log(chalk.bold('Configuration Summary'));
  console.log(chalk.dim('─'.repeat(40)));
  console.log(`  Mode:          ${config.PROJECT_TYPE}`);
  console.log(`  Project:       ${config.PROJECT_NAME}`);
  console.log(`  Stack:         ${config.TECH_STACK || 'Unknown'}`);
  console.log(`  Git:           ${config.GIT_WORKFLOW} (${config.GIT_PLATFORM})`);
  console.log(`  Docs tracking: ${config.DOCS_GITIGNORED ? 'gitignored' : 'tracked'}`);
  console.log(`  Tech layers:   ${formatLayers(config)}`);
  console.log(`  Agents:        ${formatAgents(config)}`);
  console.log('');
  console.log(chalk.bold(`Files to create: ${manifest.length + 2}`));
  console.log(chalk.dim('  (includes .specflow-config.md and .claude/settings.json)'));
  console.log('');

  // ── Confirm ───────────────────────────────────────────────────────
  if (!options.yes) {
    const proceed = await confirm({
      message: 'Proceed with initialization?',
      default: true,
    });

    if (!proceed) {
      console.log(chalk.dim('Initialization cancelled.'));
      return;
    }
    console.log('');
  }

  // ── Generate files ────────────────────────────────────────────────
  console.log(chalk.bold('Generating files...'));
  console.log('');

  // Check for existing CLAUDE.md
  const claudeMdExists = existsSync(resolve(projectDir, 'CLAUDE.md'));
  let overwriteClaudeMd = false;
  if (claudeMdExists && !options.yes) {
    overwriteClaudeMd = await confirm({
      message: 'CLAUDE.md already exists. Overwrite with SpecFlow version?',
      default: false,
    });
  }

  const { created, skipped } = generateFiles(
    projectDir,
    templatesRoot,
    manifest,
    config,
    { overwrite: false },
  );

  // Handle CLAUDE.md specially if it was skipped but user said no
  if (claudeMdExists && !overwriteClaudeMd && skipped.includes('CLAUDE.md')) {
    console.log(chalk.dim('  (Existing CLAUDE.md preserved. Add SpecFlow context manually or re-run with overwrite.)'));
  }

  generateConfig(projectDir, config);
  generateSettings(projectDir, templatesRoot, config);
  updateGitignore(projectDir, config);

  // ── Done ──────────────────────────────────────────────────────────
  console.log('');
  console.log(chalk.bold.green('SpecFlow initialized!'));
  console.log('');
  console.log(`  Created ${created.length} files`);
  if (skipped.length > 0) {
    console.log(`  Skipped ${skipped.length} files (already exist)`);
  }
  console.log('');
  console.log(chalk.dim('Next steps:'));
  console.log('  1. Review docs_specflow/ and fill in TODOs');
  console.log('  2. Run /plan-session to start your first session');
  console.log('');
}

function formatLayers(config) {
  if (!config.TECHNICAL_LAYERS) return 'disabled';
  const parts = [];
  if (config.ENABLE_HOOKS) parts.push('hooks');
  if (config.ENABLE_RULES) parts.push('rules');
  if (config.ENABLE_STATUSLINE) parts.push('statusline');
  return parts.join(', ') || 'none';
}

function formatAgents(config) {
  const core = ['base', 'qa', 'architecture', 'backend', 'frontend'];
  const specialist = (config.AGENT_ROLES || []).filter(r => !core.includes(r));
  if (specialist.length > 0) {
    return `5 core + ${specialist.length} specialist (${specialist.join(', ')})`;
  }
  return '5 core';
}
