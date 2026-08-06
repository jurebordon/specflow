/**
 * Invariants that keep the design coherent.
 *
 * SKILL.md files are prose and cannot be unit tested for behaviour, but every
 * rule the design depends on is mechanically checkable. These are the six
 * invariants listed in CLAUDE.md, plus the cross-artifact consistency that a
 * schema change is easy to half-apply.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { REPO_ROOT } from './helpers.mjs';
import { GLOBAL_SKILLS, CONFIG_SCHEMA } from '../cli/src/install.js';

const GLOBAL_SKILLS_DIR = join(REPO_ROOT, 'templates', 'global-skills');
const PAYLOAD_DIR = join(REPO_ROOT, 'templates', 'payload');
const MANIFEST = JSON.parse(readFileSync(join(REPO_ROOT, 'configuration', 'migrations', 'manifest.json'), 'utf-8'));

const skillText = (name) => readFileSync(join(GLOBAL_SKILLS_DIR, name, 'SKILL.md'), 'utf-8');

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(abs));
    else out.push(abs);
  }
  return out;
}

/** Placeholders that are legitimately supplied per invocation or per run. */
const ALLOWED_PLACEHOLDERS = new Set([
  'FEATURE_NAME', 'TICKET_ID', 'TASK_TITLE',   // session arguments
  'CURRENT_BRANCH', 'CURRENT_DATE', 'DATE'      // runtime values
]);

describe('skills ship verbatim', () => {
  test('no project-config placeholder survives in any skill', () => {
    const offenders = [];
    for (const name of GLOBAL_SKILLS) {
      for (const [, key] of skillText(name).matchAll(/\{\{([A-Z][A-Z0-9_]*)\}\}/g)) {
        if (!ALLOWED_PLACEHOLDERS.has(key)) offenders.push(`${name}: {{${key}}}`);
      }
    }
    assert.deepEqual(offenders, [],
      'a project value baked into a skill goes stale in every project that installed it');
  });

  test('the payload contains no template syntax at all', () => {
    const offenders = walk(PAYLOAD_DIR)
      .filter((f) => readFileSync(f, 'utf-8').includes('{{'))
      .map((f) => relative(REPO_ROOT, f));
    assert.deepEqual(offenders, [], 'payload files are copied byte-for-byte and cannot be rendered');
  });
});

describe('skill frontmatter', () => {
  for (const name of GLOBAL_SKILLS) {
    test(`${name} declares a matching name and the current schema`, () => {
      const text = skillText(name);
      assert.ok(text.startsWith('---\n'), 'missing frontmatter');

      const end = text.indexOf('\n---', 4);
      assert.ok(end > 0, 'unterminated frontmatter');
      const frontmatter = text.slice(4, end);

      assert.match(frontmatter, new RegExp(`^name:\\s*${name}$`, 'm'), 'name must match the directory');
      assert.match(frontmatter, /^\s+author:\s*specflow$/m, 'author marker drives install ownership');

      const schema = frontmatter.match(/^\s+config_schema:\s*(\d+)$/m);
      assert.ok(schema, 'missing config_schema');
      assert.equal(Number(schema[1]), CONFIG_SCHEMA,
        'skill expects a different schema than the installer ships');
    });
  }
});

describe('the config contract', () => {
  const CONTRACT = readFileSync(join(REPO_ROOT, 'core', 'CONFIG_CONTRACT.md'), 'utf-8');

  // Load-bearing sentences from the canonical block. Skills embed a copy, so
  // the risk is drift: a rule fixed in one place and forgotten in four others.
  const CLAUSES = [
    'Never lower `Config Schema`',
    'A no-op writes nothing',
    'Matching on test path alone is forbidden'
  ];

  test('the canonical block states each rule', () => {
    for (const clause of CLAUSES) assert.ok(CONTRACT.includes(clause), `contract lost: ${clause}`);
  });

  for (const name of GLOBAL_SKILLS.filter((s) => s !== 'specflow-init')) {
    test(`${name} reads the anchor and refuses to guess without it`, () => {
      const text = skillText(name);
      assert.match(text, /\.specflow\/config\.md/, 'skill does not read the anchor');
      assert.match(text, /has not been initialised for SpecFlow/,
        'skill must say so and offer init rather than guessing');
      assert.match(text, /Never lower `Config Schema`|never lower/i);
    });
  }
});

describe('cross-skill references', () => {
  // Skills used to reference each other by step number, which rots the moment
  // either is edited. Named anchors replaced them; this checks they resolve.
  const ANCHORS = {
    'plan-session': ['plan-structure'],
    'end-session': ['session-log-entry', 'merge-or-pr']
  };

  for (const [name, ids] of Object.entries(ANCHORS)) {
    for (const id of ids) {
      test(`${name} defines the "${id}" anchor`, () => {
        assert.match(skillText(name), new RegExp(`<a id="${id}"></a>`), 'anchor missing or renamed');
      });
    }
  }

  test('no skill references another by step number', () => {
    const offenders = [];
    for (const name of GLOBAL_SKILLS) {
      for (const other of GLOBAL_SKILLS) {
        if (name === other) continue;
        const pattern = new RegExp(`\`?${other}\`?\\s+Step\\s+\\d`, 'i');
        if (pattern.test(skillText(name))) offenders.push(`${name} -> ${other}`);
      }
    }
    assert.deepEqual(offenders, [], 'reference sibling skills by named anchor, not step number');
  });
});

describe('migration manifest', () => {
  test('declares the schema the installer ships', () => {
    assert.equal(MANIFEST.current_schema, CONFIG_SCHEMA);
    assert.equal(MANIFEST.anchor, '.specflow/config.md');
  });

  test('every referenced decision exists', () => {
    for (const migration of MANIFEST.migrations) {
      const defined = new Set(migration.decisions.map((d) => d.id));
      const referenced = migration.added_keys.flatMap((k) =>
        [k.decision, k.fallback_decision].filter(Boolean));
      for (const ref of referenced) {
        assert.ok(defined.has(ref), `added_keys references undefined decision "${ref}"`);
      }
    }
  });

  test('every decision declares whether it can be deferred', () => {
    for (const migration of MANIFEST.migrations) {
      for (const decision of migration.decisions) {
        assert.equal(typeof decision.deferrable, 'boolean', `decision "${decision.id}" lacks deferrable`);
        if (decision.deferrable) {
          assert.ok(decision.on_defer, `deferrable decision "${decision.id}" lacks on_defer behaviour`);
        }
      }
    }
  });

  test('covers every key of a schema-0 config', () => {
    // A fixture, not a real project: an earlier manual check depended on
    // sibling repositories, one of which was renamed mid-session.
    const legacy = readFileSync(join(REPO_ROOT, 'test', 'fixtures', 'legacy-config.md'), 'utf-8');

    const migration = MANIFEST.migrations.find((m) => m.from === 0);
    const covered = new Set([
      ...migration.carried_keys,
      ...migration.split_keys.map((k) => k.from),
      ...migration.renamed_keys.flatMap((r) => r.from_any_of ?? [r.from])
    ]);

    let section = '';
    const unmapped = [];
    for (const line of legacy.split('\n')) {
      const heading = line.match(/^## (.+)/);
      if (heading) { section = heading[1]; continue; }
      const key = line.match(/^- \*\*(.+?)\*\*:/);
      if (!key) continue;

      const full = `${section} > ${key[1]}`;
      const plural = migration.merged_keys?.some((m) => m.mapping.some((x) => x.from === key[1]));
      if (!covered.has(full) && !plural) unmapped.push(full);
    }
    assert.deepEqual(unmapped, [], 'a schema-0 key would be silently dropped by migration');
  });
});

describe('documented invariants hold', () => {
  test('rules reference the config rather than baking values in', () => {
    const rules = walk(join(PAYLOAD_DIR, 'rules'));
    assert.ok(rules.length > 0, 'no rules found');
    for (const file of rules) {
      assert.match(readFileSync(file, 'utf-8'), /\.specflow\/config\.md|`## Commands`|config/i,
        `${relative(REPO_ROOT, file)} does not point at the config`);
    }
  });

  test('the hook config reader is present for hooks and statusline', () => {
    // Every other hook and the statusline require it; shipping without it
    // breaks all of them at once.
    const reader = join(PAYLOAD_DIR, 'hooks', 'specflow-config.cjs');
    assert.ok(statSync(reader).isFile());
  });

  test('no skill hardcodes main or master as the default branch', () => {
    const offenders = [];
    for (const name of GLOBAL_SKILLS) {
      for (const line of skillText(name).split('\n')) {
        // Allowed when explicitly warning against the assumption.
        if (/\bgit (checkout|merge|pull|push)[^\n]*\b(main|master)\b/.test(line) && !/do not|never|rather than/i.test(line)) {
          offenders.push(`${name}: ${line.trim()}`);
        }
      }
    }
    assert.deepEqual(offenders, [], 'read Git Workflow > Default Branch instead');
  });
});
