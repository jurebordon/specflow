#!/usr/bin/env node
// Hook: Stop
// Checks for unpushed commits when Claude stops and reminds the user.

const { execSync } = require('child_process');

function execGit(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  const messages = [];

  // Check for uncommitted changes
  const status = execGit('git status --porcelain');
  if (status) {
    const changedCount = status.split('\n').filter(Boolean).length;
    messages.push('You have ' + changedCount + ' uncommitted change(s).');
  }

  // Check for unpushed commits
  const unpushed = execGit('git log @{u}.. --oneline');
  if (unpushed) {
    const commitCount = unpushed.split('\n').filter(Boolean).length;
    messages.push('You have ' + commitCount + ' unpushed commit(s).');
  }

  if (messages.length > 0) {
    process.stderr.write(
      '\n--- SpecFlow Git Reminder ---\n' +
      messages.join('\n') + '\n' +
      'Remember to push your changes before closing the session.\n' +
      '-----------------------------\n\n'
    );
  }

  process.exit(0);
}

main().catch((err) => {
  process.stderr.write('git-push-reminder: ' + err.message + '\n');
  process.exit(0);
});
