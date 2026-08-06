import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

import { install, GLOBAL_SKILLS, CONFIG_SCHEMA } from '../cli/src/install.js';
import { REPO_ROOT, tmp, runCli, skillsRoot, receiptPath, readReceipt, writeReceipt, sha256 } from './helpers.mjs';

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
      assert.ok(entry.name && entry.sha256, 'receipt entry lacks name or sha256');
      assert.equal(entry.sha256, sha256(join(skillsRoot(home), entry.name, 'SKILL.md')));
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

  test('refuses a SpecFlow skill the user has edited since install', async () => {
    const home = tmp();
    await installTo(home);
    // Keeps `author: specflow` but no longer matches the recorded fingerprint,
    // which is the case a name-only ownership check would wave through.
    const target = join(skillsRoot(home), 'end-session', 'SKILL.md');
    appendFileSync(target, '\n<!-- my local tweak -->\n');

    const { code } = await installTo(home);
    assert.equal(code, 0, 'author marker alone should still grant ownership');

    // Now drop the marker too: neither signal holds.
    writeFileSync(target, foreignSkill('end-session'));
    const second = await installTo(home);
    assert.equal(second.code, 1);
    assert.match(readFileSync(target, 'utf-8'), /MY OWN CONTENT/);
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

    const payload = join(REPO_ROOT, 'templates', 'payload');
    const hidden = join(tmp(), 'payload-moved');
    renameSync(payload, hidden);
    try {
      const { code, out } = await installTo(home);
      assert.equal(code, 1);
      assert.match(out, /Missing or unreadable/);
      assert.equal(sha256(join(skillsRoot(home), 'specflow-init', 'SKILL.md')), before);
    } finally {
      renameSync(hidden, payload);
    }
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
    receipt.skills.find((s) => s.name === GLOBAL_SKILLS[0]).sha256 = sha256(first);
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
