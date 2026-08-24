import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';

import { PAYLOAD, REPO_ROOT, tmp } from './helpers.mjs';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

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

describe('migrate: blockers and detection', () => {
  /** A git repo with a legacy config, optionally gitignoring the anchor. */
  function repo({ ignoreAnchor = false, extra = {} } = {}) {
    const root = tmp('specflow-repo-');
    execFileSync('git', ['init', '-q'], { cwd: root });
    mkdirSync(join(root, 'docs'), { recursive: true });
    writeFileSync(join(root, 'docs', '.specflow-config.md'),
      '## Tech Stack\n- **Test Command**: cd backend && pytest\n## Documentation\n- **Path**: docs\n');
    writeFileSync(join(root, '.gitignore'), ignoreAnchor ? 'node_modules\n.specflow/\n' : 'node_modules\n');
    for (const [rel, body] of Object.entries(extra)) {
      mkdirSync(join(root, rel, '..'), { recursive: true });
      mkdirSync(dirname(join(root, rel)), { recursive: true });
      writeFileSync(join(root, rel), body);
    }
    return root;
  }

  test('refuses when git would ignore the anchor', () => {
    // 1.x setup docs told people to add .specflow/ to .gitignore, and real
    // projects did. Ignored, the config is invisible to teammates and CI and
    // every skill reports "not initialised" forever, with nothing explaining it.
    const root = repo({ ignoreAnchor: true });
    const r = migrate(readFileSync(join(root, 'docs', '.specflow-config.md'), 'utf-8'), { repo: root });

    const blocker = r.blockers.find((b) => b.id === 'anchor_gitignored');
    assert.ok(blocker, 'an ignored anchor must be a blocker, not a note');
    assert.match(blocker.rule, /\.gitignore/);
    assert.equal(r.writable, false);
  });

  test('does not block when the anchor is trackable', () => {
    const root = repo({ ignoreAnchor: false });
    const r = migrate(readFileSync(join(root, 'docs', '.specflow-config.md'), 'utf-8'), { repo: root });
    assert.deepEqual(r.blockers, []);
  });

  test('detects a suite the legacy config never recorded', () => {
    // The defect list-valued commands exist to fix. Detection is mechanical
    // because delegating it to agent diligence is how it happened originally.
    const root = repo({ extra: { 'frontend/package.json': JSON.stringify({ scripts: { 'test:e2e': 'playwright test' } }) } });
    const r = migrate(readFileSync(join(root, 'docs', '.specflow-config.md'), 'utf-8'), { repo: root });

    assert.ok(r.candidates.Test.includes('cd frontend && npm run test:e2e'));
    const decision = r.decisions.find((d) => d.detected_not_recorded?.some((c) => /test:e2e/.test(c)));
    assert.ok(decision, 'an unrecorded suite must be raised, not silently omitted');
  });

  test('never proposes a command that does not terminate', () => {
    // start-session runs every Test entry. A watcher or interactive UI runner
    // in that list hangs the session forever.
    const root = repo({ extra: { 'frontend/package.json': JSON.stringify({
      scripts: { 'test:e2e': 'playwright test', 'test:e2e:ui': 'playwright test --ui', 'test:watch': 'jest --watch' }
    }) } });
    const r = migrate(readFileSync(join(root, 'docs', '.specflow-config.md'), 'utf-8'), { repo: root });

    assert.ok(r.candidates.Test.includes('cd frontend && npm run test:e2e'));
    for (const bad of ['test:e2e:ui', 'test:watch']) {
      assert.ok(!r.candidates.Test.some((c) => c.includes(bad)), `${bad} must not be proposed`);
    }
  });

  test('strips trailing slashes from every path value, not just Docs Path', () => {
    const r = migrate(legacy('## Documentation\n- **Path**: docs/\n- **Existing Docs**: legacy/'), { repo: tmp() });
    assert.equal(r.out['Docs Path'], 'docs');
    assert.equal(r.out['Existing Docs'], 'legacy');
  });

  test('ignores vendored directories when detecting', () => {
    const root = repo({ extra: { 'node_modules/pkg/package.json': JSON.stringify({ scripts: { test: 'x' } }) } });
    const r = migrate(readFileSync(join(root, 'docs', '.specflow-config.md'), 'utf-8'), { repo: root });
    assert.ok(!JSON.stringify(r.candidates).includes('node_modules'));
  });
});

describe('migrate: honest output', () => {
  test('carries Existing Docs through to the rendered file', () => {
    const r = migrate(legacy('## Documentation\n- **Path**: docs\n- **Existing Docs**: legacy-docs'), { repo: tmp() });
    assert.match(render(r, '2.0.0'), /Existing Docs.*legacy-docs/);
  });

  test('never claims a green baseline it did not verify', () => {
    // Migration runs no tests. Writing "None recorded." would assert a verified
    // baseline, turning every later failure into "probably pre-existing".
    const out = render(migrate(legacy('## Project\n- **Name**: x'), { repo: tmp() }), '2.0.0');
    assert.match(out, /UNVERIFIED/);
    assert.doesNotMatch(out, /^- None recorded\.$/m);
  });

  test('marks output as a proposal while anything is unresolved', () => {
    const out = render(migrate(legacy('## Project\n- **Name**: x'), { repo: tmp() }), '2.0.0');
    assert.match(out, /^<!-- PROPOSAL ONLY/, 'unresolved output must not look writable');
  });
});

describe('migrate: commands that do nothing', () => {
  test('flags an npm command whose flag never reaches the script', () => {
    // A real project carried `npm run lint --fix` as its formatter for months.
    // npm keeps the flag; the script sees no arguments, runs, and exits 0.
    const r = migrate(legacy('## Technical Layers\n- **Format Command**: cd frontend && npm run lint --fix'), { repo: tmp() });
    const d = r.decisions.find((x) => x.command === 'cd frontend && npm run lint --fix');
    assert.ok(d, 'a command that silently does nothing must be raised');
    assert.equal(d.deferrable, false);
    assert.match(d.suggestion, /npm run lint -- --fix/);
  });

  test('leaves a correctly-delimited command alone', () => {
    const r = migrate(legacy('## Technical Layers\n- **Format Command**: cd frontend && npm run lint -- --fix'), { repo: tmp() });
    assert.ok(!r.decisions.some((x) => x.command));
  });

  test('does not flag commands that are not npm run', () => {
    const r = migrate(legacy('## Tech Stack\n- **Lint Command**: ruff check --fix .'), { repo: tmp() });
    assert.ok(!r.decisions.some((x) => x.command));
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
