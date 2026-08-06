#!/usr/bin/env node
// Hook: SessionStart
// Auto-loads the task file, recent session log entries, and the current
// feature's SPEC.md into session context.
//
// Paths come from .specflow/config.md. The task file and session log are read
// from their configured keys rather than assumed to be ROADMAP.md and
// SESSION_LOG.md, because projects rename them.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const specflow = require('./specflow-config.cjs');

function readFileSafe(filePath) {
  try {
    return filePath ? fs.readFileSync(filePath, 'utf8') : null;
  } catch {
    return null;
  }
}

function readFirstLines(filePath, n) {
  const content = readFileSafe(filePath);
  if (!content) return null;
  return content.split('\n').slice(0, n).join('\n');
}

function detectFeature() {
  try {
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    const match = branch.match(/^(?:feat|feature|fix|refactor)\/(.+)$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  const data = JSON.parse(input);

  const cwd = data.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const cfg = specflow.load(cwd);
  if (!cfg) process.exit(0); // Not a SpecFlow project — contribute nothing.

  const docsPath = specflow.docsPath(cfg);
  const sections = [];

  const tasksFile = specflow.docFile(cfg, 'Tasks File', 'ROADMAP.md');
  const tasks = readFileSafe(tasksFile);
  if (tasks) {
    sections.push('## ' + path.basename(tasksFile) + '\n\n' + tasks);
  }

  const logFile = specflow.docFile(cfg, 'Session Log', 'SESSION_LOG.md');
  const sessionLog = readFirstLines(logFile, 100);
  if (sessionLog) {
    sections.push('## ' + path.basename(logFile) + ' (recent)\n\n' + sessionLog);
  }

  const feature = detectFeature();
  if (feature && docsPath) {
    const spec = readFileSafe(path.join(docsPath, 'feature_docs', feature, 'SPEC.md'));
    if (spec) {
      sections.push('## Feature SPEC: ' + feature + '\n\n' + spec);
    }
  }

  if (sections.length > 0) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: sections.join('\n\n---\n\n')
      }
    }));
  }
}

main().catch((err) => {
  process.stderr.write('session-start-context: ' + err.message + '\n');
});
