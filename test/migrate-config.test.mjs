import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { PAYLOAD, REPO_ROOT, tmp } from './helpers.mjs';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { parseLegacy, migrate, render } = require(join(PAYLOAD, 'migrate-config.js'));
const specflow = require(join(PAYLOAD, 'hooks', 'specflow-config.cjs'));

const MANIFEST = JSON.parse(readFileSync(join(REPO_ROOT, 'configuration', 'migrations', 'manifest.json'), 'utf-8'));

const legacy = (body) => `# SpecFlow Project Configuration\n\n${body}\n`;
const cmds = (r, kind) => r.commands[kind];
const decisionIds = (r) => new Set(r.decisions.map((d) => d.id));

describe('migrate: command transforms', () => {
  test('single commands become one-item lists', () => {
    const r = migrate(legacy(`## Tech Stack
- **Test Command**: cd backend && pytest tests/
- **Lint Command**: cd frontend && npm run lint`), { repo: tmp() });

    assert.deepEqual(cmds(r, 'Test'), ['cd backend && pytest tests/']);
    assert.deepEqual(cmds(r, 'Lint'), ['cd frontend && npm run lint']);
  });

  test('Format and Typecheck are found under either schema-0 heading', () => {
    // generate.js wrote these under Technical Layers; real project files put
    // them under Tech Stack. Both shapes exist in the wild.
    const underTechStack = migrate(legacy(`## Tech Stack
- **Format Command**: black .
- **Typecheck Command**: mypy`), { repo: tmp() });
    const underLayers = migrate(legacy(`## Technical Layers
- **Format Command**: black .
- **Typecheck Command**: mypy`), { repo: tmp() });

    assert.deepEqual(cmds(underTechStack, 'Format'), ['black .']);
    assert.deepEqual(cmds(underLayers, 'Format'), ['black .']);
    assert.deepEqual(cmds(underTechStack, 'Typecheck'), ['mypy']);
  });

  test('the mixed-stack plural shape survives, deduplicated', () => {
    // This is the only schema-0 form that already held multiple commands per
    // category, and the easiest to lose: the key line has an empty value, so a
    // naive parser records "" and drops every indented sub-bullet.
    const r = migrate(legacy(`## Tech Stack
- **Test Command**: pytest

## Tech Commands (Mixed Stack)
- **Test Commands**:
  - Python: pytest
  - DBT: dbt test
- **Build Commands**:
  - Python: python -m build
  - DBT: dbt build`), { repo: tmp() });

    assert.deepEqual(cmds(r, 'Test'), ['pytest', 'dbt test'], 'labels dropped, singular merged, no duplicate');
    assert.deepEqual(cmds(r, 'Build'), ['python -m build', 'dbt build']);
  });

  test('sub-bullet collection stops at the next section', () => {
    const { sublists, scalars } = parseLegacy(`## Tech Commands (Mixed Stack)
- **Test Commands**:
  - Python: pytest

## Git Workflow
- **Default Branch**: trunk
`);
    assert.deepEqual(sublists['Test Commands'], ['pytest']);
    assert.equal(scalars['Default Branch'], 'trunk');
  });
});

describe('migrate: prose is not a command', () => {
  const rejected = ['n/a', 'N/A (no build step)', 'TBD', 'none', 'see README', 'ask team', 'use CI', 'refer to the docs'];
  const kept = ['pytest', 'npm test', 'go test ./...', 'cd backend && pytest -q', 'make check', 'cargo test --all-features', 'ruff check .'];

  for (const value of rejected) {
    test(`rejects ${JSON.stringify(value)}`, () => {
      const r = migrate(legacy(`## Tech Stack\n- **Test Command**: ${value}`), { repo: tmp() });
      assert.deepEqual(cmds(r, 'Test'), [], 'prose was carried forward as an executable command');
      assert.ok(decisionIds(r).has('command_lists'), 'rejection must surface as a decision');
    });
  }

  for (const value of kept) {
    test(`keeps ${JSON.stringify(value)}`, () => {
      const r = migrate(legacy(`## Tech Stack\n- **Test Command**: ${value}`), { repo: tmp() });
      assert.deepEqual(cmds(r, 'Test'), [value], 'a real command was dropped');
    });
  }
});

describe('migrate: keys', () => {
  test('splits inline ticket format out of Ticketing', () => {
    const r = migrate(legacy(`## Integrations\n- **Ticketing**: jira (format: PROJ-123)`), { repo: tmp() });
    assert.equal(r.out.Ticketing, 'jira');
    assert.equal(r.out['Ticket Format'], 'PROJ-123');
  });

  test('strips the trailing slash from the docs path', () => {
    const r = migrate(legacy(`## Documentation\n- **Path**: docs/`), { repo: tmp() });
    assert.equal(r.out['Docs Path'], 'docs');
  });

  test('derives Tasks File and Session Log when the defaults exist', () => {
    const repo = tmp();
    mkdirSync(join(repo, 'docs'), { recursive: true });
    writeFileSync(join(repo, 'docs', 'ROADMAP.md'), '# R');
    writeFileSync(join(repo, 'docs', 'SESSION_LOG.md'), '# S');

    const r = migrate(legacy(`## Documentation\n- **Path**: docs`), { repo });
    assert.equal(r.out['Tasks File'], join('docs', 'ROADMAP.md'));
    assert.equal(r.out['Session Log'], join('docs', 'SESSION_LOG.md'));
    assert.ok(!decisionIds(r).has('doc_file_names'));
  });

  test('raises a non-deferrable decision when the defaults are absent', () => {
    const r = migrate(legacy(`## Documentation\n- **Path**: docs`), { repo: tmp() });
    const decision = r.decisions.find((d) => d.id === 'doc_file_names');
    assert.ok(decision, 'missing task file must be surfaced, not guessed');
    assert.equal(decision.deferrable, false,
      'deferring would write a config pointing at files that do not exist');
  });

  test('always raises the baseline and gate decisions', () => {
    const ids = decisionIds(migrate(legacy('## Project\n- **Name**: x'), { repo: tmp() }));
    assert.ok(ids.has('failure_baseline'));
    assert.ok(ids.has('review_gate'));
  });
});

describe('migrate: constrained value spaces', () => {
  // The whole legacy vocabulary, driven from the manifest so this cannot drift
  // from what the migration actually does. The Type bug reached review because
  // the fixture and tests only ever contained `solo`: the shapes were covered
  // exhaustively, the value space inside each key was not.
  const SPACES = Object.entries(MANIFEST.migrations[0].value_spaces)
    .filter(([k]) => !k.startsWith('_'));

  const withScalar = (key, value) => legacy(`## Section\n- **${key}**: ${value}`);

  test('the table covers every key that has one', () => {
    assert.deepEqual(
      SPACES.map(([k]) => k).sort(),
      ['Documentation > Tracking', 'Git Workflow > Platform', 'Git Workflow > Type',
       'Integrations > Ticketing', 'Project > Mode']
    );
  });

  for (const [key, spec] of SPACES) {
    for (const legacyValue of Object.keys(spec.map)) {
      test(`${spec.scalar}: "${legacyValue}" migrates to an accepted value`, () => {
        const r = migrate(withScalar(spec.scalar, legacyValue), { repo: tmp() });
        const result = r.out[spec.scalar];
        assert.ok(
          spec.accepted.includes(result),
          `"${legacyValue}" produced "${result}", which schema 1 does not accept`
        );
      });
    }

    test(`${spec.scalar}: an unrecognised value never reaches the config`, () => {
      const r = migrate(withScalar(spec.scalar, 'zzz-not-a-real-value'), { repo: tmp() });
      if (spec.free_form) {
        // Legitimate: SpecFlow does not need to know every tracker by name.
        assert.equal(r.out[spec.scalar], 'zzz-not-a-real-value');
      } else {
        assert.equal(r.out[spec.scalar], undefined,
          'a value no consumer matches must not be written');
        const decision = r.decisions.find((d) => d.id === spec.on_unmapped);
        assert.ok(decision, `expected decision "${spec.on_unmapped}"`);
        assert.equal(decision.deferrable, false);
      }
    });
  }

  test('every case difference is normalised, not passed through', () => {
    // All three real schema-0 projects inspected recorded "Ticketing: None".
    const r = migrate(withScalar('Ticketing', 'None'), { repo: tmp() });
    assert.equal(r.out.Ticketing, 'none',
      'capitalised None reads as a configured ticketing system that does not exist');
  });

  test('records the CI distinction it cannot represent', () => {
    const r = migrate(withScalar('Type', 'ci-cd-gated'), { repo: tmp() });
    assert.equal(r.out.Type, 'team');
    assert.ok(r.notes.some((n) => /CI/.test(n)), 'a lossy mapping must be stated, not silent');
  });
});

describe('migrate: round trip', () => {
  test('rendered output parses back through the hook reader intact', () => {
    const repo = tmp();
    mkdirSync(join(repo, '.specflow'), { recursive: true });
    mkdirSync(join(repo, '.git'), { recursive: true });

    const result = migrate(legacy(`## Project
- **Name**: data-platform
- **Mode**: adoption

## Tech Stack
- **Languages**: Python, SQL

## Tech Commands (Mixed Stack)
- **Test Commands**:
  - Python: pytest
  - DBT: dbt test

## Git Workflow
- **Default Branch**: trunk

## Integrations
- **Ticketing**: jira (format: PROJ-123)

## Documentation
- **Path**: docs/`), { repo });

    writeFileSync(join(repo, '.specflow', 'config.md'), render(result, '2.0.0'), 'utf-8');

    const cfg = specflow.load(repo);
    assert.equal(cfg.schema, 1);
    assert.deepEqual(specflow.commandList(cfg, 'Test'), ['pytest', 'dbt test']);
    assert.equal(cfg.scalars['Default Branch'], 'trunk');
    assert.equal(cfg.scalars['Ticket Format'], 'PROJ-123');
    assert.equal(cfg.scalars['Docs Path'], 'docs');
  });

  test('an empty baseline is not mistaken for a command list', () => {
    const repo = tmp();
    mkdirSync(join(repo, '.specflow'), { recursive: true });
    mkdirSync(join(repo, '.git'), { recursive: true });
    const result = migrate(legacy('## Tech Stack\n- **Test Command**: pytest'), { repo });
    writeFileSync(join(repo, '.specflow', 'config.md'), render(result, '2.0.0'), 'utf-8');

    const cfg = specflow.load(repo);
    assert.deepEqual(specflow.commandList(cfg, 'Known Test Failures'), []);
    assert.deepEqual(specflow.commandList(cfg, 'Test'), ['pytest']);
  });
});
