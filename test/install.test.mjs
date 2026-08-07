import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync, appendFileSync, cpSync } from 'node:fs';
import { join } from 'node:path';

import { install, GLOBAL_SKILLS, CONFIG_SCHEMA } from '../cli/src/install.js';
import { REPO_ROOT, tmp, runCli, makeRepoCopy, skillsRoot, receiptPath, readReceipt, writeReceipt, sha256 } from './helpers.mjs';

/** Run install() in-process against a temp HOME, capturing console noise. */
async function installTo(home, options = {}) {
  const realHome = process.env.HOME;
  const log = console.log, warn = console.warn, error = console.error;
  const out = [];
  process.env.HOME = home;
  console.log = console.warn = console.error = (...a) => out.push(a.join(' '));
  const prevExit = process.exitCode;
  process.exitCode = 0;
  try {
    await install(options);
    return { code: process.exitCode ?? 0, out: out.join('\n') };
  } finally {
    process.exitCode = prevExit;
    process.env.HOME = realHome;
    console.log = log; console.warn = warn; console.error = error;
  }
}

const foreignSkill = (name) =>
  `---\nname: ${name}\ndescription: hand written\nmetadata:\n  author: someone-else\n---\nMY OWN CONTENT.\n`;

describe('install: layout', () => {
  test('installs every skill and specflow-init keeps its dependencies', async () => {
    const home = tmp();
    const { code } = await installTo(home);
    assert.equal(code, 0);

    for (const name of GLOBAL_SKILLS) {
      assert.ok(existsSync(join(skillsRoot(home), name, 'SKILL.md')), `${name}/SKILL.md missing`);
    }

    // specflow-init resolves these relative to itself; without them it is
    // discoverable but cannot migrate or install a payload.
    const init = join(skillsRoot(home), 'specflow-init');
    for (const dep of ['CONFIG_SCHEMA.md', 'migrations/manifest.json', 'payload/hooks/specflow-config.cjs', 'payload/migrate-config.js']) {
      assert.ok(existsSync(join(init, dep)), `specflow-init/${dep} missing`);
    }
  });

  test('skills ship verbatim — byte-identical to source', async () => {
    const home = tmp();
    await installTo(home);
    for (const name of GLOBAL_SKILLS) {
      assert.equal(
        sha256(join(skillsRoot(home), name, 'SKILL.md')),
        sha256(join(REPO_ROOT, 'templates', 'global-skills', name, 'SKILL.md')),
        `${name} was modified during install`
      );
    }
  });

  test('leaves no staging or backup directories behind', async () => {
    const home = tmp();
    await installTo(home);
    assert.ok(!existsSync(join(skillsRoot(home), '.specflow-staging')));
    assert.ok(!existsSync(join(skillsRoot(home), '.specflow-backup')));
  });

  test('receipt records version, schema and a fingerprint per skill', async () => {
    const home = tmp();
    await installTo(home);
    const receipt = readReceipt(home);

    assert.equal(receipt.config_schema, CONFIG_SCHEMA);
    assert.equal(receipt.skills.length, GLOBAL_SKILLS.length);
    for (const entry of receipt.skills) {
      assert.ok(entry.name && entry.files, 'receipt entry lacks name or files');
      assert.equal(entry.files['SKILL.md'], sha256(join(skillsRoot(home), entry.name, 'SKILL.md')));
    }

    // The record must cover everything specflow-init owns, not just SKILL.md.
    const init = receipt.skills.find((s) => s.name === 'specflow-init');
    for (const rel of ['CONFIG_SCHEMA.md', 'migrations/manifest.json', 'payload/hooks/specflow-config.cjs']) {
      assert.ok(init.files[rel], `receipt does not cover ${rel}`);
    }
  });

  test('re-install is idempotent', async () => {
    const home = tmp();
    await installTo(home);
    const before = sha256(join(skillsRoot(home), 'plan-session', 'SKILL.md'));
    const { code } = await installTo(home);
    assert.equal(code, 0);
    assert.equal(sha256(join(skillsRoot(home), 'plan-session', 'SKILL.md')), before);
  });
});

describe('install: ownership', () => {
  test('refuses a hand-authored skill of the same name', async () => {
    const home = tmp();
    await installTo(home);
    const target = join(skillsRoot(home), 'plan-session', 'SKILL.md');
    writeFileSync(target, foreignSkill('plan-session'));

    const { code, out } = await installTo(home);
    assert.equal(code, 1);
    assert.match(out, /Refusing to overwrite/);
    assert.match(readFileSync(target, 'utf-8'), /MY OWN CONTENT/, 'user content was destroyed');
  });

  test('refuses a SpecFlow skill the user edited, marker notwithstanding', async () => {
    const home = tmp();
    await installTo(home);

    // Tweaking the body while leaving the frontmatter alone is the normal way
    // to customise an installed skill. `author: specflow` still says specflow,
    // so an author-based check would overwrite the edit without asking.
    const target = join(skillsRoot(home), 'end-session', 'SKILL.md');
    appendFileSync(target, '\n<!-- my local tweak -->\n');

    const { code, out } = await installTo(home);
    assert.equal(code, 1, 'a local edit must not be silently overwritten');
    assert.match(out, /edited since install/);
    assert.match(readFileSync(target, 'utf-8'), /my local tweak/);
  });

  test('refuses when a payload file was patched but SKILL.md was not', async () => {
    const home = tmp();
    await installTo(home);

    // specflow-init owns more than its SKILL.md. Fingerprinting only that file
    // would leave a patched hook or manifest invisible to the check.
    const hook = join(skillsRoot(home), 'specflow-init', 'payload', 'hooks', 'doc-file-blocker.cjs');
    appendFileSync(hook, '\n// local patch\n');

    const { code, out } = await installTo(home);
    assert.equal(code, 1);
    assert.match(out, /payload\/hooks\/doc-file-blocker\.cjs/);
    assert.match(readFileSync(hook, 'utf-8'), /local patch/);
  });

  test('refuses an unreceipted skill even when it claims our authorship', async () => {
    const home = tmp();
    await installTo(home);
    rmSync(receiptPath(home));

    const { code, out } = await installTo(home);
    assert.equal(code, 1, 'without a record there is nothing to verify against');
    assert.match(out, /no install record/);
  });

  test('a legacy receipt of bare names grants no ownership', async () => {
    const home = tmp();
    await installTo(home);
    writeFileSync(join(skillsRoot(home), 'start-session', 'SKILL.md'), foreignSkill('start-session'));
    // Pre-2.0 receipt shape.
    writeReceipt(home, { version: '1.3.2', skills: GLOBAL_SKILLS });

    const { code } = await installTo(home);
    assert.equal(code, 1, 'bare-name receipt must not vouch for a foreign skill');
  });

  test('--force replaces a foreign skill', async () => {
    const home = tmp();
    await installTo(home);
    writeFileSync(join(skillsRoot(home), 'plan-session', 'SKILL.md'), foreignSkill('plan-session'));

    const { code } = await installTo(home, { force: true });
    assert.equal(code, 0);
    assert.doesNotMatch(readFileSync(join(skillsRoot(home), 'plan-session', 'SKILL.md'), 'utf-8'), /MY OWN CONTENT/);
  });
});

describe('install: failure handling', () => {
  test('dry run writes nothing at all', async () => {
    const home = tmp();
    const { code } = await installTo(home, { dryRun: true });
    assert.equal(code, 0);
    assert.ok(!existsSync(skillsRoot(home)), 'dry run created the skills directory');
  });

  test('a missing source aborts before anything is written', async () => {
    const home = tmp();
    await installTo(home);
    const before = sha256(join(skillsRoot(home), 'specflow-init', 'SKILL.md'));

    // Against a copy: breaking the real templates/ would race every other
    // suite, which imports from it.
    const broken = makeRepoCopy({ omit: ['templates/payload'] });
    const { code, stdout, stderr } = runCli(['install'], { home, bin: broken.bin });

    assert.equal(code, 1);
    assert.match(stdout + stderr, /Missing or unreadable/);
    assert.equal(sha256(join(skillsRoot(home), 'specflow-init', 'SKILL.md')), before,
      'a failed install must not disturb the previous one');
  });

  test('a failed swap rolls the previous install back', async () => {
    const home = tmp();
    await installTo(home);

    // Mark the previous install so a rollback is distinguishable from a
    // fresh re-copy, and keep the receipt consistent so ownership holds.
    const marker = '<!-- PREVIOUS-INSTALL -->';
    const first = join(skillsRoot(home), GLOBAL_SKILLS[0], 'SKILL.md');
    appendFileSync(first, `\n${marker}\n`);
    const receipt = readReceipt(home);
    receipt.skills.find((s) => s.name === GLOBAL_SKILLS[0]).files['SKILL.md'] = sha256(first);
    writeReceipt(home, receipt);
    const receiptBefore = readFileSync(receiptPath(home), 'utf-8');

    const { code, out } = await installTo(home, { __failAfterSwaps: 3 });

    assert.equal(code, 1);
    assert.match(out, /Rolled back 3 skills/);
    assert.match(readFileSync(first, 'utf-8'), new RegExp(marker),
      'rollback re-copied instead of restoring the previous directory');

    for (const name of GLOBAL_SKILLS) {
      assert.ok(existsSync(join(skillsRoot(home), name, 'SKILL.md')), `${name} lost during rollback`);
    }
    assert.equal(readFileSync(receiptPath(home), 'utf-8'), receiptBefore,
      'receipt must not be written when the swap fails');
    assert.ok(!existsSync(join(skillsRoot(home), '.specflow-backup')));
    assert.ok(!existsSync(join(skillsRoot(home), '.specflow-staging')));
  });
});

describe('install: interrupted transaction recovery', () => {
  // A crash between the two renames of a swap (SIGKILL, reboot, closed
  // terminal) leaves the only copy of a skill in .specflow-backup. A leftover
  // backup is therefore a pending transaction, not scratch space.

  test('restores a skill whose destination never arrived', async () => {
    const home = tmp();
    await installTo(home);

    // Simulate the crash: destination renamed aside, replacement never landed.
    const backupRoot = join(skillsRoot(home), '.specflow-backup');
    mkdirSync(backupRoot, { recursive: true });
    const dest = join(skillsRoot(home), 'plan-session');
    renameSync(dest, join(backupRoot, 'plan-session'));
    appendFileSync(join(backupRoot, 'plan-session', 'SKILL.md'), '\n<!-- ONLY-COPY -->\n');
    assert.ok(!existsSync(dest), 'precondition: destination is gone');

    const { out } = await installTo(home);

    assert.match(out, /recovered plan-session from an interrupted install/);
    assert.ok(existsSync(join(dest, 'SKILL.md')), 'skill was not recovered');
    assert.ok(!existsSync(backupRoot), 'backup should be cleared once recovered');
  });

  test('does not destroy the only copy before recovering it', async () => {
    const home = tmp();
    await installTo(home);

    const backupRoot = join(skillsRoot(home), '.specflow-backup');
    mkdirSync(backupRoot, { recursive: true });
    renameSync(join(skillsRoot(home), 'end-session'), join(backupRoot, 'end-session'));
    const marked = join(backupRoot, 'end-session', 'SKILL.md');
    appendFileSync(marked, '\n<!-- ONLY-COPY -->\n');

    await installTo(home);

    // The marker proves the recovered directory was the backup rather than a
    // fresh copy -- i.e. that startup did not delete it and reinstall over it.
    // Ownership then refuses, because a recovered skill differs from what the
    // receipt recorded, which is the correct conservative outcome.
    const recovered = readFileSync(join(skillsRoot(home), 'end-session', 'SKILL.md'), 'utf-8');
    assert.match(recovered, /ONLY-COPY/, 'the only copy was destroyed instead of recovered');
  });

  test('discards a backup whose swap had already completed', async () => {
    const home = tmp();
    await installTo(home);

    // Both present: the swap finished, only cleanup was interrupted.
    const backupRoot = join(skillsRoot(home), '.specflow-backup');
    mkdirSync(join(backupRoot, 'start-session'), { recursive: true });
    writeFileSync(join(backupRoot, 'start-session', 'SKILL.md'), 'stale previous copy');

    const { code, out } = await installTo(home);
    assert.equal(code, 0);
    assert.match(out, /discarded superseded backup of start-session/);
    assert.ok(!existsSync(backupRoot));
    assert.doesNotMatch(
      readFileSync(join(skillsRoot(home), 'start-session', 'SKILL.md'), 'utf-8'),
      /stale previous copy/
    );
  });

  test('a dry run never touches a pending backup', async () => {
    const home = tmp();
    await installTo(home);
    const backupRoot = join(skillsRoot(home), '.specflow-backup');
    mkdirSync(join(backupRoot, 'plan-session'), { recursive: true });
    writeFileSync(join(backupRoot, 'plan-session', 'SKILL.md'), 'pending');

    await installTo(home, { dryRun: true });
    assert.ok(existsSync(join(backupRoot, 'plan-session', 'SKILL.md')),
      'dry run consumed a pending transaction');
  });
});

describe('cli surface', () => {
  test('removed init exits non-zero and points at the new flow', () => {
    const { code, stdout } = runCli(['init'], { home: tmp() });
    assert.equal(code, 1);
    assert.match(stdout, /specflow install/);
    assert.match(stdout, /specflow-init/);
  });

  test('update installs the machine skills', () => {
    const home = tmp();
    const { code } = runCli(['update'], { home });
    assert.equal(code, 0);
    assert.ok(existsSync(join(skillsRoot(home), 'plan-session', 'SKILL.md')));
  });

  test('--version reports the package version', () => {
    const pkg = JSON.parse(readFileSync(join(REPO_ROOT, 'cli', 'package.json'), 'utf-8'));
    const { stdout } = runCli(['--version'], { home: tmp() });
    assert.equal(stdout.trim(), pkg.version);
  });
});
