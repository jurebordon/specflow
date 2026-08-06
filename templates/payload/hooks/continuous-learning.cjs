#!/usr/bin/env node
// Hook: PostToolUse
// Periodically reminds the agent to capture learned patterns in
// LEARNED_PATTERNS.md. Silent unless that file already exists.

const fs = require('fs');
const path = require('path');
const os = require('os');
const specflow = require('./specflow-config.cjs');

const REMINDER_INTERVAL = 30;

function getCounterPath() {
  const sessionId = process.env.CLAUDE_SESSION_ID || 'default';
  return path.join(os.tmpdir(), 'specflow-learning-count-' + sessionId + '.txt');
}

function readCounter(counterPath) {
  try {
    return parseInt(fs.readFileSync(counterPath, 'utf8').trim(), 10) || 0;
  } catch {
    return 0;
  }
}

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  const data = JSON.parse(input);

  const cwd = data.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const cfg = specflow.load(cwd);
  if (!cfg) process.exit(0);

  const docsRel = specflow.docsPathRelative(cfg);
  const docsAbs = specflow.docsPath(cfg);
  if (!docsAbs || !fs.existsSync(path.join(docsAbs, 'LEARNED_PATTERNS.md'))) {
    process.exit(0);
  }

  const counterPath = getCounterPath();
  const count = readCounter(counterPath) + 1;

  try {
    fs.writeFileSync(counterPath, String(count), 'utf8');
  } catch {
    // Ignore temp-file write errors.
  }

  if (count > 0 && count % REMINDER_INTERVAL === 0) {
    process.stderr.write(
      '\n--- SpecFlow Learning Reminder ---\n' +
      'You have made ' + count + ' edits this session.\n' +
      'If you discovered any patterns, conventions, or gotchas, consider adding them to\n' +
      docsRel + '/LEARNED_PATTERNS.md so future sessions can benefit.\n' +
      '----------------------------------\n\n'
    );
  }

  process.exit(0);
}

main().catch((err) => {
  process.stderr.write('continuous-learning: ' + err.message + '\n');
  process.exit(0);
});
