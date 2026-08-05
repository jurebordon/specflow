#!/usr/bin/env node
// Hook: PostToolUse
// Tracks tool call count and suggests /compact when threshold is reached.

const fs = require('fs');
const path = require('path');
const os = require('os');

const FIRST_THRESHOLD = 50;
const REPEAT_INTERVAL = 25;

function getCounterPath() {
  const sessionId = process.env.CLAUDE_SESSION_ID || 'default';
  return path.join(os.tmpdir(), 'specflow-tool-count-' + sessionId + '.txt');
}

function readCounter(counterPath) {
  try {
    const content = fs.readFileSync(counterPath, 'utf8').trim();
    return parseInt(content, 10) || 0;
  } catch {
    return 0;
  }
}

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  const counterPath = getCounterPath();
  const count = readCounter(counterPath) + 1;

  try {
    fs.writeFileSync(counterPath, String(count), 'utf8');
  } catch {
    // Ignore write errors to temp file
  }

  const shouldSuggest =
    count === FIRST_THRESHOLD ||
    (count > FIRST_THRESHOLD && (count - FIRST_THRESHOLD) % REPEAT_INTERVAL === 0);

  if (shouldSuggest) {
    process.stderr.write(
      '\n--- SpecFlow Suggestion ---\n' +
      'Tool call count: ' + count + '. ' +
      'Consider running /compact to free up context window space.\n' +
      'This helps maintain performance in longer sessions.\n' +
      '---------------------------\n\n'
    );
  }

  process.exit(0);
}

main().catch((err) => {
  process.stderr.write('compact-suggester: ' + err.message + '\n');
  process.exit(0);
});
