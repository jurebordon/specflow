import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';
import chalk from 'chalk';
import { confirm } from '@inquirer/prompts';
import { askBasicQuestions, getDefaults } from './questions.js';
import {
  getTemplatesRoot,
  buildStructuralManifest,
  generateFiles,
  generateConfig,
  generateSettings,
  generateSkeletonDocs,
  generateSkeletonClaudeMd,
  updateGitignore,
} from './generate.js';
import { deriveGitVariables } from './config.js';

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
    console.log(chalk.yellow('Use `specflow-ai update` to update templates, or delete docs_specflow/.specflow-config.md to re-init.'));
    console.log('');
    return;
  }

  // ── Phase 1a: Basic questions ──────────────────────────────────────
  let config;
  if (options.yes) {
    config = getDefaults();
    console.log(chalk.dim('Using default configuration (--yes)'));
    console.log('');
  } else {
    config = await askBasicQuestions(options);
    console.log('');
  }

  // ── Phase 1b: Set placeholder values for tech stack ────────────────
  // Tech detection is deferred to /init-specflow (AI-powered codebase analysis).
  // CLI sets placeholders; /init-specflow detects, populates config, AND updates command files directly.
  config.TECH_STACK = config.TECH_STACK || 'Unknown';
  config.TEST_COMMAND = '# Detected by /init-specflow';
  config.BUILD_COMMAND = '# Detected by /init-specflow';
  config.LINT_COMMAND = '# Detected by /init-specflow';
  config.FORMAT_COMMAND = '# Detected by /init-specflow';
  config.TYPECHECK_COMMAND = '# Detected by /init-specflow';

  // ── Derive GIT_WORKFLOW booleans and template variables ────────────
  deriveGitVariables(config);

  // ── Set SpecFlow version for skill frontmatter ──────────────────────
  try {
    const pkg = JSON.parse(readFileSync(resolve(cliRoot, 'package.json'), 'utf-8'));
    config.SPECFLOW_VERSION = pkg.version;
  } catch {
    config.SPECFLOW_VERSION = 'unknown';
  }

  // ── Build structural file manifest ─────────────────────────────────
  const templatesRoot = getTemplatesRoot(cliRoot);

  if (!existsSync(templatesRoot)) {
    console.log(chalk.red('Error: Templates not found.'));
    console.log(chalk.red(`Expected at: ${templatesRoot}`));
    console.log(chalk.red('If running from source, ensure you are in the specflow repo.'));
    process.exit(1);
  }

  const manifest = buildStructuralManifest(templatesRoot, config);

  // ── Show summary ──────────────────────────────────────────────────
  // Count total files: manifest + skeleton docs (5) + CLAUDE.md + config + settings
  const skeletonDocCount = 5; // OVERVIEW, VISION, ROADMAP, ADR, CUSTOM
  const extraFileCount = 3;   // .specflow-config.md, settings.json, CLAUDE.md
  const totalFiles = manifest.length + skeletonDocCount + extraFileCount;

  console.log(chalk.bold('Configuration Summary'));
  console.log(chalk.dim('─'.repeat(40)));
  console.log(`  Mode:          ${config.PROJECT_TYPE}`);
  console.log(`  Project:       ${config.PROJECT_NAME}`);
  console.log(`  Stack:         ${config.TECH_STACK || 'Unknown'}`);
  console.log(`  Git:           ${config.GIT_WORKFLOW} (${config.GIT_PLATFORM})`);
  console.log(`  Docs tracking: ${config.DOCS_GITIGNORED ? 'gitignored' : 'tracked'}`);
  console.log(`  Tech layers:   ${formatLayers(config)}`);
  if (config.EXISTING_DOCS_PATH) {
    console.log(`  Existing docs: ${config.EXISTING_DOCS_PATH}`);
  }
  console.log('');
  console.log(chalk.bold(`Files to create: ~${totalFiles}`));
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

  // 1. Render structural files (skills, hooks, rules, agents, renderable docs)
  const { created: structCreated, skipped: structSkipped } = generateFiles(
    projectDir,
    templatesRoot,
    manifest,
    config,
    { overwrite: false },
  );

  // 2. Write skeleton docs (OVERVIEW, VISION, ROADMAP, ADR)
  const { created: skelCreated, skipped: skelSkipped } = generateSkeletonDocs(
    projectDir,
    config,
    { overwrite: false },
  );

  // 3. Write skeleton CLAUDE.md
  const claudeResult = generateSkeletonClaudeMd(
    projectDir,
    config,
    { overwrite: claudeMdExists ? overwriteClaudeMd : true },
  );

  // Handle CLAUDE.md specially if it was skipped but user said no
  if (claudeMdExists && !overwriteClaudeMd && claudeResult.skipped) {
    console.log(chalk.dim('  (Existing CLAUDE.md preserved. Add SpecFlow context manually or re-run with overwrite.)'));
  }

  // 4. Config and settings
  generateConfig(projectDir, config);
  generateSettings(projectDir, templatesRoot, config);
  updateGitignore(projectDir, config);

  // ── Done ──────────────────────────────────────────────────────────
  const allCreated = [...structCreated, ...skelCreated];
  if (claudeResult.created) allCreated.push('CLAUDE.md');
  const allSkipped = [...structSkipped, ...skelSkipped];
  if (claudeResult.skipped) allSkipped.push('CLAUDE.md');

  console.log('');
  console.log(chalk.bold.green('SpecFlow initialized!'));
  console.log('');
  console.log(`  Created ${allCreated.length} files`);
  if (allSkipped.length > 0) {
    console.log(`  Skipped ${allSkipped.length} files (already exist)`);
  }
  console.log('');
  console.log(chalk.bold('Next steps:'));
  console.log('');
  console.log(`  ${chalk.cyan('1.')} Open Claude Code in this project`);
  console.log(`  ${chalk.cyan('2.')} Run ${chalk.bold('/init-specflow')} to populate docs with AI-analyzed content`);
  console.log(`  ${chalk.cyan('3.')} Then run ${chalk.bold('/plan-session')} to start your first session`);
  console.log('');
  console.log(chalk.dim('The /init-specflow command will scan your codebase and fill in OVERVIEW, VISION,'));
  console.log(chalk.dim('ROADMAP, ADR, and CLAUDE.md with project-specific content.'));
  console.log('');
  console.log(chalk.bold('Optional: Install specialist agents'));
  console.log('');
  console.log(chalk.dim('  For focused code reviews and implementation, install community agents:'));
  console.log(`  ${chalk.cyan('https://github.com/VoltAgent/awesome-claude-code-subagents')}`);
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
