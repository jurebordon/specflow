/**
 * Shared test utilities.
 *
 * Every test is hermetic: it works in a fresh temp directory with HOME
 * redirected, and never reads or writes the real ~/.claude or any project on
 * this machine. That is not just tidiness -- an earlier manual test suite
 * depended on sibling repositories, and one of them was renamed mid-session,
 * which would have silently changed what the tests covered.
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = resolve(__dirname, '..');
export const CLI_BIN = join(REPO_ROOT, 'cli', 'bin', 'specflow.js');
export const PAYLOAD = join(REPO_ROOT, 'templates', 'payload');

const created = [];

/** Temp directory, removed when the process exits. */
export function tmp(prefix = 'specflow-test-') {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  created.push(dir);
  return dir;
}

process.on('exit', () => {
  for (const dir of created) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // Best effort; the OS reclaims temp space regardless.
    }
  }
});

/** Run the CLI with HOME redirected. Never throws on non-zero exit. */
export function runCli(args, { home, cwd = REPO_ROOT, bin = CLI_BIN } = {}) {
  try {
    const stdout = execFileSync('node', [bin, ...args], {
      cwd,
      env: { ...process.env, HOME: home, USERPROFILE: home },
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    return { code: 0, stdout, stderr: '' };
  } catch (err) {
    return {
      code: err.status ?? 1,
      stdout: err.stdout?.toString() ?? '',
      stderr: err.stderr?.toString() ?? ''
    };
  }
}

export const skillsRoot = (home) => join(home, '.claude', 'skills');
export const receiptPath = (home) => join(skillsRoot(home), '.specflow-install.json');

export function readReceipt(home) {
  return JSON.parse(readFileSync(receiptPath(home), 'utf-8'));
}

export function writeReceipt(home, receipt) {
  writeFileSync(receiptPath(home), JSON.stringify(receipt, null, 2), 'utf-8');
}

export function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

/**
 * A throwaway copy of the repo's installable parts, so a test can break the
 * sources without touching the working tree.
 *
 * Necessary because tests run concurrently: a test that renamed the real
 * templates/payload aside made every other suite fail intermittently, since
 * they import from it. Anything that mutates sources must mutate a copy.
 *
 * node_modules is symlinked rather than copied — it is large and read-only
 * here. Both locations are linked when present: npm workspaces hoist the CLI's
 * dependencies to the repo root, but a standalone `npm install` inside cli/
 * puts them in cli/node_modules, and the copy has to resolve either way.
 */
export function makeRepoCopy({ omit = [] } = {}) {
  const root = tmp('specflow-repo-');
  mkdirSync(join(root, 'cli'), { recursive: true });

  for (const dir of ['templates', 'configuration']) {
    cpSync(join(REPO_ROOT, dir), join(root, dir), { recursive: true });
  }
  for (const entry of ['bin', 'src', 'package.json']) {
    cpSync(join(REPO_ROOT, 'cli', entry), join(root, 'cli', entry), { recursive: true });
  }

  for (const rel of ['node_modules', join('cli', 'node_modules')]) {
    const source = join(REPO_ROOT, rel);
    if (existsSync(source)) symlinkSync(source, join(root, rel), 'dir');
  }

  for (const rel of omit) rmSync(join(root, rel), { recursive: true, force: true });

  return { root, bin: join(root, 'cli', 'bin', 'specflow.js') };
}

/** A minimal repo with a .specflow/config.md, for hook and reader tests. */
export function makeProject({ config, files = {} } = {}) {
  const root = tmp('specflow-project-');
  mkdirSync(join(root, '.specflow'), { recursive: true });
  mkdirSync(join(root, '.git'), { recursive: true });
  writeFileSync(join(root, '.specflow', 'config.md'), config, 'utf-8');

  for (const [rel, contents] of Object.entries(files)) {
    const abs = join(root, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, contents, 'utf-8');
  }
  return root;
}

/** Drive a hook the way Claude Code does: JSON on stdin. */
export function runHook(hookFile, payload, { cwd } = {}) {
  try {
    const stdout = execFileSync('node', [join(PAYLOAD, 'hooks', hookFile)], {
      input: JSON.stringify(payload),
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return { code: 0, stdout, stderr: '' };
  } catch (err) {
    return {
      code: err.status ?? 1,
      stdout: err.stdout?.toString() ?? '',
      stderr: err.stderr?.toString() ?? ''
    };
  }
}

export const SCHEMA_1_CONFIG = `# SpecFlow Project Configuration

## SpecFlow
- **Config Schema**: 1
- **SpecFlow Version**: 2.0.0

## Project
- **Name**: fixture
- **Mode**: adoption

## Tech Stack
- **Languages**: Python, TypeScript

## Documentation
- **Docs Path**: docs/
- **Tasks File**: docs/TASKS.md
- **Session Log**: docs/JOURNAL.md
- **Tracking**: tracked

## Commands

### Test
- \`cd backend && pytest -q\`
- \`cd frontend && npm test\`

### Format
- \`cd backend && black\`
- \`cd frontend && prettier --write\`

## Known Test Failures
- None recorded.

## Git Workflow
- **Default Branch**: trunk
`;
