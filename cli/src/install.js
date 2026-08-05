/**
 * `specflow install` — place the machine-level skills into ~/.claude/skills/.
 *
 * This is the whole of SpecFlow's per-machine setup. Skills ship verbatim: no
 * placeholder substitution, no project values baked in. Everything a skill
 * needs to know about a project it reads at runtime from .specflow/config.md,
 * which the specflow-init skill writes.
 *
 * Per-project setup is not done here. It is done by running specflow-init
 * inside the project, which also installs the payload (hooks, rules,
 * settings) from this skill's own directory.
 */

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Skills installed to the machine. */
export const GLOBAL_SKILLS = [
  'specflow-init',
  'plan-session',
  'start-session',
  'end-session',
  'plan-autonomous-batch'
];

/** Schema version the shipped skills expect. Must match CONFIG_SCHEMA.md. */
export const CONFIG_SCHEMA = 1;

const RECEIPT = '.specflow-install.json';

/**
 * Locate bundled sources. In the published package these live under
 * cli/templates/ (written by scripts/bundle-templates.js); in a source
 * checkout they are at the repo root.
 */
function resolveSources() {
  const cliRoot = resolve(__dirname, '..');
  const bundled = resolve(cliRoot, 'templates');
  const repoRoot = resolve(cliRoot, '..');

  // Repo root first. cli/templates/ is a build artefact written by
  // prepublishOnly and is not tracked, so in a source checkout it is usually
  // stale -- preferring it would install yesterday's skills while the working
  // tree shows today's.
  const candidates = [
    { templates: resolve(repoRoot, 'templates'), configuration: resolve(repoRoot, 'configuration') },
    { templates: resolve(bundled, 'templates'), configuration: resolve(bundled, 'configuration') }
  ];

  for (const c of candidates) {
    if (existsSync(join(c.templates, 'global-skills')) && existsSync(join(c.configuration, 'CONFIG_SCHEMA.md'))) {
      return c;
    }
  }
  return null;
}

/** Read a skill's `metadata.author` without a YAML dependency. */
function skillAuthor(skillMdPath) {
  try {
    const text = readFileSync(skillMdPath, 'utf-8');
    const end = text.indexOf('\n---', 4);
    const frontmatter = end === -1 ? text : text.slice(0, end);
    const m = frontmatter.match(/^\s+author:\s*(.+)$/m);
    return m ? m[1].trim() : null;
  } catch {
    return null;
  }
}

/**
 * A skill directory is ours to replace only if SpecFlow wrote it. A user who
 * authored their own plan-session should not silently lose it to an install.
 */
function isOurs(skillDir, receiptNames) {
  const skillMd = join(skillDir, 'SKILL.md');
  if (!existsSync(skillMd)) return true; // nothing meaningful there
  if (skillAuthor(skillMd) === 'specflow') return true;
  // basename, not split('/') — path.join uses backslashes on Windows, which
  // would compare a full path against a bare skill name and never match,
  // wrongly flagging our own receipt-owned skill as foreign.
  return receiptNames.includes(basename(skillDir));
}

function readReceipt(skillsRoot) {
  try {
    return JSON.parse(readFileSync(join(skillsRoot, RECEIPT), 'utf-8'));
  } catch {
    return null;
  }
}

export async function install(options = {}) {
  const dryRun = Boolean(options.dryRun);
  const force = Boolean(options.force);

  const sources = resolveSources();
  if (!sources) {
    console.error(chalk.red('Could not locate SpecFlow templates.'));
    console.error('Expected cli/templates/ (published package) or ../templates/ (source checkout).');
    process.exitCode = 1;
    return;
  }

  const skillsRoot = join(homedir(), '.claude', 'skills');
  const previous = readReceipt(skillsRoot);
  const previousNames = previous?.skills ?? [];

  const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf-8'));

  console.log(chalk.bold(`\nSpecFlow ${pkg.version} — installing machine skills`));
  console.log(chalk.dim(`  target: ${skillsRoot}`));
  if (previous) console.log(chalk.dim(`  replacing install of ${previous.version}`));
  console.log();

  // Refuse before writing anything if a foreign skill would be clobbered.
  const conflicts = [];
  for (const name of GLOBAL_SKILLS) {
    const dir = join(skillsRoot, name);
    if (existsSync(dir) && !isOurs(dir, previousNames)) conflicts.push(name);
  }

  if (conflicts.length > 0 && !force) {
    console.error(chalk.red('Refusing to overwrite skills SpecFlow did not install:'));
    for (const name of conflicts) console.error(`  ${join(skillsRoot, name)}`);
    console.error('\nThese have no `author: specflow` marker, so they look hand-authored.');
    console.error('Move them aside, or re-run with --force to replace them.');
    process.exitCode = 1;
    return;
  }

  // Build the full plan and verify every source exists BEFORE deleting
  // anything. specflow-init is only usable with its schema, manifest and
  // payload alongside it, so a run that removes the old copy and then finds a
  // missing source would leave a skill that is still discoverable but cannot
  // do its job -- the worst of both states.
  const plan = [];
  for (const name of GLOBAL_SKILLS) {
    const items = [
      { from: join(sources.templates, 'global-skills', name, 'SKILL.md'), to: 'SKILL.md', label: 'SKILL.md' }
    ];

    if (name === 'specflow-init') {
      items.push(
        { from: join(sources.configuration, 'CONFIG_SCHEMA.md'), to: 'CONFIG_SCHEMA.md', label: 'CONFIG_SCHEMA.md' },
        { from: join(sources.configuration, 'migrations'), to: 'migrations', label: 'migrations/' },
        { from: join(sources.templates, 'payload'), to: 'payload', label: 'payload/' }
      );
    }

    plan.push({ name, dest: join(skillsRoot, name), items });
  }

  const missing = plan.flatMap((s) => s.items.filter((i) => !existsSync(i.from)).map((i) => i.from));
  if (missing.length > 0) {
    console.error(chalk.red('Incomplete SpecFlow sources — nothing was written:'));
    for (const m of missing) console.error(`  ${m}`);
    process.exitCode = 1;
    return;
  }

  if (!dryRun) mkdirSync(skillsRoot, { recursive: true });

  const written = [];
  for (const { name, dest, items } of plan) {
    console.log(chalk[dryRun ? 'blue' : 'green'](`  ${dryRun ? 'would install' : 'install'}  ${name}/`));
    for (const item of items.slice(1)) {
      console.log(chalk[dryRun ? 'blue' : 'green'](`    ${dryRun ? 'would add' : 'add'}  ${item.label}`));
    }

    if (!dryRun) {
      // Replace SpecFlow's own files wholesale; a stale skill file is worse
      // than a missing one.
      if (existsSync(dest)) rmSync(dest, { recursive: true });
      mkdirSync(dest, { recursive: true });
      for (const item of items) {
        cpSync(item.from, join(dest, item.to), { recursive: true });
      }
    }

    written.push(name);
  }

  if (!dryRun) {
    // The receipt records what this machine has, so a later install knows
    // which directories are its own to replace.
    writeFileSync(
      join(skillsRoot, RECEIPT),
      JSON.stringify(
        { version: pkg.version, config_schema: CONFIG_SCHEMA, skills: written, installed_at: new Date().toISOString() },
        null,
        2
      ) + '\n',
      'utf-8'
    );
  }

  console.log();
  if (dryRun) {
    console.log(chalk.blue('Dry run — nothing written.'));
    return;
  }

  console.log(chalk.bold('Installed.'));
  console.log(`\nSkills are available in every project on this machine.`);
  console.log(`Next: run ${chalk.cyan('specflow-init')} inside a project to set it up.`);
  console.log(chalk.dim(`\nConfig schema ${CONFIG_SCHEMA}. Projects on an older schema are migrated by specflow-init.`));
}
