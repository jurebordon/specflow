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

import {
  accessSync, constants, cpSync, existsSync, mkdirSync, readdirSync,
  readFileSync, renameSync, statSync, writeFileSync, rmSync
} from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
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

/** sha256 of a file, or null if it cannot be read. */
function fileHash(filePath) {
  try {
    return createHash('sha256').update(readFileSync(filePath)).digest('hex');
  } catch {
    return null;
  }
}

/**
 * A skill directory is ours to replace only if SpecFlow wrote it and nobody
 * has changed it since. A user who authored their own plan-session should not
 * silently lose it to an install.
 *
 * Ownership by name alone is not safe. A previous install records the names it
 * wrote; if the user then replaces one of those directories with a skill of
 * their own, a name check still grants SpecFlow ownership and the next install
 * deletes their work without ever asking for --force.
 *
 * So the receipt stores a fingerprint per skill, and the fallback only applies
 * when the file on disk is byte-identical to what we installed. Anything
 * edited since is treated as the user's. Receipts from older versions record
 * bare names and grant nothing.
 */
function isOurs(skillDir, receiptEntries) {
  const skillMd = join(skillDir, 'SKILL.md');
  if (!existsSync(skillMd)) return true; // nothing meaningful there
  if (skillAuthor(skillMd) === 'specflow') return true;

  const entry = receiptEntries.find(
    (e) => e && typeof e === 'object' && e.name === basename(skillDir)
  );
  if (!entry?.sha256) return false;

  return fileHash(skillMd) === entry.sha256;
}

/**
 * Can every file under this path actually be read?
 *
 * This has to be checked up front rather than handled on failure. cpSync on an
 * unreadable directory does not throw a catchable JS error — it surfaces a C++
 * std::filesystem_error that aborts the process (SIGABRT), so no try/catch and
 * no cleanup handler ever runs. Refusing during validation converts an
 * unrecoverable crash into an ordinary, reversible error.
 */
function isReadable(target) {
  try {
    const stats = statSync(target);
    if (!stats.isDirectory()) {
      accessSync(target, constants.R_OK);
      return true;
    }
    for (const entry of readdirSync(target, { withFileTypes: true })) {
      if (!isReadable(join(target, entry.name))) return false;
    }
    return true;
  } catch {
    return false;
  }
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

  // Test-only fault injection. Rollback is the one path that cannot be
  // exercised by arranging real filesystem state: the swap deliberately
  // renames rather than deletes, so the obvious ways to break it (unreadable
  // or undeletable destinations) no longer fail. Without a seam the rollback
  // code would ship untested, which for a path whose whole job is recovering
  // from failure is exactly backwards. Not exposed on the CLI.
  const failAfterSwaps = Number(options.__failAfterSwaps ?? 0);

  const sources = resolveSources();
  if (!sources) {
    console.error(chalk.red('Could not locate SpecFlow templates.'));
    console.error('Expected cli/templates/ (published package) or ../templates/ (source checkout).');
    process.exitCode = 1;
    return;
  }

  const skillsRoot = join(homedir(), '.claude', 'skills');
  const previous = readReceipt(skillsRoot);
  const previousEntries = previous?.skills ?? [];

  const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf-8'));

  console.log(chalk.bold(`\nSpecFlow ${pkg.version} — installing machine skills`));
  console.log(chalk.dim(`  target: ${skillsRoot}`));
  if (previous) console.log(chalk.dim(`  replacing install of ${previous.version}`));
  console.log();

  // Refuse before writing anything if a foreign skill would be clobbered.
  const conflicts = [];
  for (const name of GLOBAL_SKILLS) {
    const dir = join(skillsRoot, name);
    if (existsSync(dir) && !isOurs(dir, previousEntries)) conflicts.push(name);
  }

  if (conflicts.length > 0 && !force) {
    console.error(chalk.red('Refusing to overwrite skills SpecFlow did not install:'));
    for (const name of conflicts) console.error(`  ${join(skillsRoot, name)}`);
    console.error('\nThese are either hand-authored, or were edited since SpecFlow installed them.');
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

  const unusable = plan.flatMap((s) =>
    s.items.filter((i) => !existsSync(i.from) || !isReadable(i.from)).map((i) => i.from)
  );
  if (unusable.length > 0) {
    console.error(chalk.red('Missing or unreadable SpecFlow sources — nothing was written:'));
    for (const m of unusable) console.error(`  ${m}`);
    process.exitCode = 1;
    return;
  }

  for (const { name, items } of plan) {
    console.log(chalk[dryRun ? 'blue' : 'green'](`  ${dryRun ? 'would install' : 'install'}  ${name}/`));
    for (const item of items.slice(1)) {
      console.log(chalk[dryRun ? 'blue' : 'green'](`    ${dryRun ? 'would add' : 'add'}  ${item.label}`));
    }
  }

  if (dryRun) {
    console.log();
    console.log(chalk.blue('Dry run — nothing written.'));
    return;
  }

  mkdirSync(skillsRoot, { recursive: true });

  // Stage every skill in full, then swap them into place.
  //
  // Copying directly over the destination means a copy that fails partway --
  // disk full, a permissions change, an interrupt -- destroys a working
  // install and leaves a skill that is still discoverable but missing the
  // payload or manifest it needs. Staging first keeps the existing install
  // untouched until every byte is on disk; the swap is then a sequence of
  // renames, which are cheap and atomic per directory.
  //
  // Staging and backups live inside skillsRoot so renames never cross a
  // filesystem boundary.
  const staging = join(skillsRoot, '.specflow-staging');
  const backupRoot = join(skillsRoot, '.specflow-backup');

  // Every destination replaced so far, with the backup it was moved to.
  // Deleting a destination before renaming the new one into place would make
  // any later failure unrecoverable -- the old skill is gone and the new one
  // never arrived. Moving it aside instead keeps a rollback available right
  // up until the receipt is written.
  const swapped = [];

  try {
    if (existsSync(staging)) rmSync(staging, { recursive: true });
    if (existsSync(backupRoot)) rmSync(backupRoot, { recursive: true });
    mkdirSync(staging, { recursive: true });
    mkdirSync(backupRoot, { recursive: true });

    for (const { name, items } of plan) {
      const stageDir = join(staging, name);
      mkdirSync(stageDir, { recursive: true });
      for (const item of items) {
        cpSync(item.from, join(stageDir, item.to), { recursive: true });
      }
    }

    for (const { name, dest } of plan) {
      let backup = null;
      if (existsSync(dest)) {
        backup = join(backupRoot, name);
        renameSync(dest, backup);
      }
      renameSync(join(staging, name), dest);
      swapped.push({ dest, backup });

      if (failAfterSwaps && swapped.length === failAfterSwaps) {
        throw new Error(`injected swap failure after ${failAfterSwaps}`);
      }
    }

    // The receipt is part of the transaction: an install whose skills landed
    // but whose receipt did not would lose track of what it owns, and the next
    // run would treat its own skills as foreign.
    writeFileSync(
      join(skillsRoot, RECEIPT),
      JSON.stringify(
        {
          version: pkg.version,
          config_schema: CONFIG_SCHEMA,
          // Fingerprints, not bare names -- see isOurs().
          skills: plan.map(({ name, dest }) => ({
            name,
            sha256: fileHash(join(dest, 'SKILL.md'))
          })),
          installed_at: new Date().toISOString()
        },
        null,
        2
      ) + '\n',
      'utf-8'
    );
  } catch (err) {
    // Put back everything already swapped, newest first.
    let restored = 0;
    for (const { dest, backup } of swapped.reverse()) {
      try {
        if (existsSync(dest)) rmSync(dest, { recursive: true });
        if (backup && existsSync(backup)) {
          renameSync(backup, dest);
          restored++;
        }
      } catch {
        // Keep going: restoring the rest is still better than stopping here.
      }
    }

    console.error(chalk.red(`\nInstall failed: ${err.message}`));
    console.error(
      restored > 0
        ? `Rolled back ${restored} skill${restored === 1 ? '' : 's'}; your previous install is intact.`
        : 'Nothing was replaced; your previous install is intact.'
    );
    process.exitCode = 1;
    return;
  } finally {
    // Only now are the backups redundant.
    for (const dir of [staging, backupRoot]) {
      try {
        if (existsSync(dir)) rmSync(dir, { recursive: true });
      } catch (err) {
        // Dot-directories are ignored as skills, so a leftover is not harmful
        // -- but a leftover backup is a full copy of the previous install, and
        // silently leaving one on disk is the kind of thing a user should hear
        // about rather than discover later.
        console.warn(chalk.yellow(`\nCould not remove ${dir}: ${err.message}`));
        console.warn(chalk.dim('It is safe to delete manually; the next install replaces it.'));
      }
    }
  }

  console.log();
  console.log(chalk.bold('Installed.'));
  console.log(`\nSkills are available in every project on this machine.`);
  console.log(`Next: run ${chalk.cyan('specflow-init')} inside a project to set it up.`);
  console.log(chalk.dim(`\nConfig schema ${CONFIG_SCHEMA}. Projects on an older schema are migrated by specflow-init.`));
}
