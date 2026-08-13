import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, existsSync, readdirSync, readFileSync, copyFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

import { PAYLOAD, tmp, makeProject, runHook, SCHEMA_1_CONFIG } from './helpers.mjs';

const require = createRequire(import.meta.url);
const specflow = require(join(PAYLOAD, 'hooks', 'specflow-config.cjs'));

describe('specflow-config: locating the anchor', () => {
  test('walks up from a nested subdirectory', () => {
    const root = makeProject({ config: SCHEMA_1_CONFIG, files: { 'frontend/src/app.ts': '' } });
    const cfg = specflow.load(join(root, 'frontend', 'src'));
    assert.equal(cfg.root, root);
    assert.equal(cfg.schema, 1);
  });

  test('stops at a nested repository boundary', () => {
    // A submodule with no config of its own is uninitialised. Inheriting the
    // parent's config would point its hooks at another project's docs.
    const root = makeProject({ config: SCHEMA_1_CONFIG });
    mkdirSync(join(root, 'vendor', 'nested', '.git'), { recursive: true });
    assert.equal(specflow.load(join(root, 'vendor', 'nested')), null);
  });

  test('returns null outside any project', () => {
    assert.equal(specflow.load(tmp()), null);
  });
});

describe('specflow-config: values', () => {
  const cfg = () => specflow.load(makeProject({ config: SCHEMA_1_CONFIG }));

  test('command lists keep every entry', () => {
    assert.deepEqual(specflow.commandList(cfg(), 'Test'), ['cd backend && pytest -q', 'cd frontend && npm test']);
  });

  test('an unconfigured category is an empty list, never undefined', () => {
    assert.deepEqual(specflow.commandList(cfg(), 'Build'), []);
  });

  test('"None recorded." is not parsed as a command', () => {
    assert.deepEqual(specflow.commandList(cfg(), 'Known Test Failures'), []);
  });

  test('trailing slash is stripped from the docs path', () => {
    assert.equal(specflow.docsPathRelative(cfg()), 'docs');
  });

  test('explicit Tasks File and Session Log win over the defaults', () => {
    const c = cfg(); // one project — cfg() builds a fresh temp repo each call
    assert.equal(specflow.docFile(c, 'Tasks File', 'ROADMAP.md'), join(c.root, 'docs/TASKS.md'));
    assert.equal(specflow.docFile(c, 'Session Log', 'SESSION_LOG.md'), join(c.root, 'docs/JOURNAL.md'));
  });

  test('paths escaping the repo root are refused', () => {
    const root = makeProject({ config: SCHEMA_1_CONFIG.replace('- **Docs Path**: docs/', '- **Docs Path**: ../elsewhere') });
    assert.equal(specflow.docsPath(specflow.load(root)), null);
  });

  test('unfilled <angle bracket> placeholders are treated as absent', () => {
    const root = makeProject({ config: SCHEMA_1_CONFIG.replace('- **Docs Path**: docs/', '- **Docs Path**: <docs>') });
    assert.equal(specflow.docsPath(specflow.load(root)), null);
  });

  test('malformed config never throws', () => {
    const root = makeProject({ config: 'not a config at all\n## Commands\n### Test\n' });
    assert.doesNotThrow(() => {
      const cfg = specflow.load(root);
      specflow.docsPath(cfg);
      specflow.commandList(cfg, 'Test');
      specflow.docFile(cfg, 'Tasks File', 'ROADMAP.md');
    });
  });
});

describe('doc-file-blocker', () => {
  const project = () =>
    makeProject({
      config: SCHEMA_1_CONFIG,
      files: {
        'docs/VISION.md': 'a real, populated vision',
        'docs/archive/VISION.md': 'an old copy',
        'docs/feature_docs/search/SPEC.md': 'frozen requirements',
        'docs/TASKS.md': '# Tasks',
        'backend/service.py': ''
      }
    });

  const block = (root, rel) =>
    runHook('doc-file-blocker.cjs', { cwd: root, tool_input: { file_path: join(root, rel) } }).code;

  test('blocks the docs-root VISION.md', () => {
    assert.equal(block(project(), 'docs/VISION.md'), 2);
  });

  test('does not block a nested VISION.md', () => {
    // <docs>/archive/VISION.md is a different document, not the frozen one.
    assert.equal(block(project(), 'docs/archive/VISION.md'), 0);
  });

  test('blocks a feature SPEC.md', () => {
    assert.equal(block(project(), 'docs/feature_docs/search/SPEC.md'), 2);
  });

  test('allows ordinary docs and source files', () => {
    const root = project();
    assert.equal(block(root, 'docs/TASKS.md'), 0);
    assert.equal(block(root, 'backend/service.py'), 0);
  });

  test('allows creating a feature SPEC that does not exist yet', () => {
    // new-feature's whole job is writing this file for the first time. A guard
    // that blocked creation as well as modification would make that skill
    // unusable wherever hooks are enabled -- frozen applies to requirements
    // that exist, not to the act of writing them.
    assert.equal(block(project(), 'docs/feature_docs/brand-new/SPEC.md'), 0);
  });

  test('allows a skeleton VISION.md so init can populate it', () => {
    const root = makeProject({
      config: SCHEMA_1_CONFIG,
      files: { 'docs/VISION.md': 'TODO: specflow-init will populate this' }
    });
    assert.equal(block(root, 'docs/VISION.md'), 0);
  });

  test('blocks nothing in a project with no SpecFlow config', () => {
    const root = tmp();
    mkdirSync(join(root, '.git'), { recursive: true });
    writeFileSync(join(root, 'VISION.md'), 'unrelated');
    assert.equal(block(root, 'VISION.md'), 0);
  });
});

describe('auto-format', () => {
  /** Config whose formatters append the file they were handed to a log. */
  function formatterProject() {
    const root = makeProject({
      config: SCHEMA_1_CONFIG,
      files: { 'backend/service.py': '', 'frontend/src/app.ts': '', 'README.md': '' }
    });
    const log = join(root, 'fmt.log');
    const recorder = (tag) =>
      `node -e "require('fs').appendFileSync('${log}','${tag} '+process.argv[1]+String.fromCharCode(10))"`;
    writeFileSync(
      join(root, '.specflow', 'config.md'),
      SCHEMA_1_CONFIG
        .replace('- `cd backend && black`', '- `cd backend && ' + recorder('BACKEND') + '`')
        .replace('- `cd frontend && prettier --write`', '- `cd frontend && ' + recorder('FRONTEND') + '`'),
      'utf-8'
    );
    return { root, log };
  }

  const format = (root, rel) =>
    runHook('auto-format.cjs', { cwd: root, tool_input: { file_path: join(root, rel) } });

  test('routes each file to the formatter that owns its directory', () => {
    const { root, log } = formatterProject();
    format(root, 'backend/service.py');
    format(root, 'frontend/src/app.ts');

    const lines = existsSync(log) ? require('node:fs').readFileSync(log, 'utf-8') : '';
    assert.match(lines, /BACKEND service\.py/, 'python file went to the wrong formatter');
    assert.match(lines, /FRONTEND src\/app\.ts/, 'ts file went to the wrong formatter');
    assert.equal(lines.trim().split('\n').length, 2, 'a file was formatted more than once');
  });

  test('skips markdown and other non-code files', () => {
    const { root, log } = formatterProject();
    format(root, 'README.md');
    assert.ok(!existsSync(log), 'markdown should not be handed to a formatter');
  });

  test('a filename containing a shell substitution does not execute it', () => {
    const { root } = formatterProject();
    const evil = '$(touch pwned).py';
    writeFileSync(join(root, 'backend', evil), '');
    format(root, join('backend', evil));
    assert.ok(!existsSync(join(root, 'backend', 'pwned')), 'command injection through the file name');
  });
});

describe('session-start-context', () => {
  test('reads the configured task file and session log, not assumed names', () => {
    const root = makeProject({
      config: SCHEMA_1_CONFIG,
      files: {
        'docs/TASKS.md': '# Tasks\n## Now\n- [ ] ship it [feature: x]\n',
        'docs/JOURNAL.md': '# Journal\n## [x] 2026-08-05\nDid a thing.\n',
        // Decoys with the default names: picking these up would be the bug.
        'docs/ROADMAP.md': 'DECOY ROADMAP\n',
        'docs/SESSION_LOG.md': 'DECOY LOG\n'
      }
    });

    const { stdout } = runHook('session-start-context.cjs', { cwd: root });
    const context = JSON.parse(stdout).hookSpecificOutput.additionalContext;

    assert.match(context, /ship it \[feature: x\]/);
    assert.match(context, /Did a thing/);
    assert.doesNotMatch(context, /DECOY/, 'hook read the assumed filenames instead of the configured ones');
  });

  test('contributes nothing in a project with no config', () => {
    const root = tmp();
    mkdirSync(join(root, '.git'), { recursive: true });
    assert.equal(runHook('session-start-context.cjs', { cwd: root }).stdout.trim(), '');
  });
});

describe('module format', () => {
  // Hooks are CommonJS and get copied into arbitrary user projects. A project
  // with "type": "module" in package.json makes Node treat a copied .js file
  // as ESM, so `require` is undefined and every hook crashes on load --
  // including doc-file-blocker, which then silently stops protecting frozen
  // files. The .cjs extension is immune to the host project's package.json.
  test('every shipped hook is .cjs', () => {
    const stray = readdirSync(join(PAYLOAD, 'hooks')).filter((f) => f.endsWith('.js'));
    assert.deepEqual(stray, [], 'hooks copied into projects must be .cjs');
  });

  test('settings reference the .cjs hooks', () => {
    const settings = readFileSync(join(PAYLOAD, 'settings', 'hooks.json'), 'utf-8');
    assert.doesNotMatch(settings, /hooks\/[a-z-]+\.js"/, 'hooks.json points at .js files');
    assert.match(settings, /hooks\/[a-z-]+\.cjs/);
  });

  test('hooks load inside a project whose package.json says type: module', () => {
    const root = makeProject({
      config: SCHEMA_1_CONFIG,
      files: {
        'package.json': JSON.stringify({ name: 'esm-project', type: 'module' }),
        'docs/VISION.md': 'a real, populated vision'
      }
    });
    // Hooks run from the project's own .claude/hooks, which is where the host
    // package.json applies.
    const dest = join(root, '.claude', 'hooks');
    mkdirSync(dest, { recursive: true });
    for (const f of readdirSync(join(PAYLOAD, 'hooks'))) {
      copyFileSync(join(PAYLOAD, 'hooks', f), join(dest, f));
    }

    const result = spawnSync('node', [join(dest, 'doc-file-blocker.cjs')], {
      input: JSON.stringify({ cwd: root, tool_input: { file_path: join(root, 'docs/VISION.md') } }),
      encoding: 'utf-8'
    });

    assert.doesNotMatch(result.stderr, /require is not defined/, 'hook broke under an ESM project');
    assert.equal(result.status, 2, 'frozen VISION.md should still be blocked');
  });
});
