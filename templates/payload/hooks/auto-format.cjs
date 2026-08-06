#!/usr/bin/env node
// Hook: PostToolUse (matcher: Write|Edit)
// Runs the project's formatter on edited files.
//
// Format commands are a list in .specflow/config.md, because a repo with a
// backend and a frontend has more than one formatter. Appending a .ts file to
// `cd backend && black .` would be wrong, so this hook picks the command whose
// scope contains the edited file rather than running them all.

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const specflow = require('./specflow-config.cjs');

const SKIP_EXTENSIONS = new Set([
  '.md', '.markdown', '.txt', '.json', '.yaml', '.yml',
  '.toml', '.ini', '.cfg', '.conf', '.env', '.lock',
  '.gitignore', '.dockerignore', '.editorconfig'
]);

/**
 * Quote a path for the shell.
 *
 * execSync runs through a shell, and the formatter command is a shell string
 * ("cd frontend && npx prettier --write"), so the file path must be quoted
 * before it is appended. Double quotes are not enough: the shell still expands
 * `$(...)`, backticks and `$VAR` inside them, and file paths are attacker-
 * influenced in a way the command string is not. Single quotes suppress all
 * expansion; an embedded quote is closed, escaped and reopened.
 */
function shellQuote(value) {
  return "'" + String(value).replace(/'/g, "'\\''") + "'";
}

/**
 * Split a command into its working directory and the command to run there.
 * `cd backend && black .` -> { dir: 'backend', command: 'black .' }
 * `prettier --write`      -> { dir: '',        command: 'prettier --write' }
 */
function parseScope(raw) {
  const m = raw.match(/^\s*cd\s+([^&|;]+?)\s*&&\s*(.+)$/);
  if (!m) return { dir: '', command: raw.trim() };
  return { dir: m[1].trim().replace(/\/+$/, ''), command: m[2].trim() };
}

/**
 * Choose the formatter whose scope directory contains the file. Longest scope
 * wins, so a nested subproject beats a repo-root formatter. Returns null when
 * nothing matches — better to format nothing than to hand a file to the wrong
 * formatter.
 */
function selectFormatter(commands, root, resolved) {
  let best = null;

  for (const raw of commands) {
    const { dir, command } = parseScope(raw);
    const scopeAbs = dir ? path.resolve(root, dir) : root;
    const inScope = resolved === scopeAbs || resolved.startsWith(scopeAbs + path.sep);
    if (!inScope) continue;
    if (!best || scopeAbs.length > best.scopeAbs.length) {
      best = { scopeAbs, command };
    }
  }

  return best;
}

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  const data = JSON.parse(input);

  const toolInput = data.tool_input || {};
  const filePath = toolInput.file_path || toolInput.path || '';
  if (!filePath) process.exit(0);

  const ext = path.extname(filePath).toLowerCase();
  if (!ext || SKIP_EXTENSIONS.has(ext)) process.exit(0);

  const cwd = data.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const cfg = specflow.load(cwd);
  if (!cfg) process.exit(0);

  const commands = specflow.commandList(cfg, 'Format');
  if (commands.length === 0) process.exit(0);

  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) process.exit(0);

  const formatter = selectFormatter(commands, cfg.root, resolved);
  if (!formatter) process.exit(0);

  const relative = path.relative(formatter.scopeAbs, resolved);

  try {
    execSync(formatter.command + ' ' + shellQuote(relative), {
      cwd: formatter.scopeAbs,
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10000
    });
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString() : err.message;
    process.stderr.write('auto-format: formatting warning: ' + stderr + '\n');
  }

  process.exit(0);
}

main().catch((err) => {
  process.stderr.write('auto-format: ' + err.message + '\n');
  process.exit(0);
});
