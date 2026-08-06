#!/usr/bin/env node
// Hook: PostToolUse (Write|Edit)
// Tracks changed files during a session and periodically suggests relevant specialist agents.
// Suggestions are advisory — they remind the user to consider agents, not require them.

const fs = require('fs');
const path = require('path');
const os = require('os');

// Suggest after this many file edits, then every REPEAT_INTERVAL edits
const FIRST_THRESHOLD = 8;
const REPEAT_INTERVAL = 10;

// File patterns → specialist role suggestions
const AGENT_RULES = [
  {
    patterns: [/\.(test|spec)\.(js|ts|jsx|tsx|py|rb)$/i, /__tests__\//i, /tests?\//i],
    role: 'testing/QA specialist',
    reason: 'test files modified'
  },
  {
    patterns: [/routes?\//i, /controllers?\//i, /api\//i, /server\//i, /middleware\//i, /services?\//i, /models?\//i, /migrations?\//i],
    role: 'backend specialist',
    reason: 'backend files modified'
  },
  {
    patterns: [/components?\//i, /pages?\//i, /views?\//i, /hooks?\//i, /stores?\//i, /styles?\//i, /\.css$/i, /\.scss$/i, /\.vue$/i, /\.svelte$/i],
    role: 'frontend specialist',
    reason: 'frontend files modified'
  },
  {
    patterns: [/auth/i, /login/i, /password/i, /token/i, /session/i, /permission/i, /secret/i, /crypt/i, /\.env/i, /credentials/i],
    role: 'security specialist',
    reason: 'security-sensitive files modified'
  },
  {
    patterns: [/package\.json$/i, /tsconfig/i, /webpack/i, /vite\.config/i, /rollup/i, /\.babelrc/i, /Dockerfile/i, /docker-compose/i, /\.github\//i, /Makefile$/i],
    role: 'build/config specialist',
    reason: 'build/config files modified'
  }
];

function getStatePath() {
  const sessionId = process.env.CLAUDE_SESSION_ID || 'default';
  return path.join(os.tmpdir(), 'specflow-agent-suggest-' + sessionId + '.json');
}

function readState(statePath) {
  try {
    return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch {
    return { editCount: 0, files: [], suggestedAt: 0 };
  }
}

function writeState(statePath, state) {
  try {
    fs.writeFileSync(statePath, JSON.stringify(state), 'utf8');
  } catch {
    // Ignore write errors to temp file
  }
}

function matchRoles(files) {
  const matched = new Map();

  for (const file of files) {
    for (const rule of AGENT_RULES) {
      for (const pattern of rule.patterns) {
        if (pattern.test(file)) {
          if (!matched.has(rule.role)) {
            matched.set(rule.role, { role: rule.role, reason: rule.reason, files: [] });
          }
          matched.get(rule.role).files.push(file);
          break;
        }
      }
    }
  }

  return Array.from(matched.values());
}

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  const data = JSON.parse(input);

  // Extract the file path from the tool input
  const toolInput = data.tool_input || {};
  const filePath = toolInput.file_path || toolInput.path || '';

  if (!filePath) {
    process.exit(0);
  }

  const statePath = getStatePath();
  const state = readState(statePath);

  // Track the file
  state.editCount += 1;
  if (!state.files.includes(filePath)) {
    state.files.push(filePath);
  }

  // Check if we should suggest
  const shouldSuggest =
    state.editCount === FIRST_THRESHOLD ||
    (state.editCount > FIRST_THRESHOLD && (state.editCount - state.suggestedAt) >= REPEAT_INTERVAL);

  if (shouldSuggest) {
    state.suggestedAt = state.editCount;

    const suggestions = matchRoles(state.files);

    if (suggestions.length > 0) {
      const lines = [
        '',
        '--- SpecFlow Agent Suggestion ---',
        'You\'ve edited ' + state.files.length + ' file(s) this session. Consider a specialist agent for:',
        ''
      ];

      for (const s of suggestions) {
        lines.push('  * ' + s.role + ' (' + s.reason + ')');
      }

      lines.push('');
      lines.push('Check .claude/agents/ for installed agents, or install community agents:');
      lines.push('https://github.com/VoltAgent/awesome-claude-code-subagents');
      lines.push('---------------------------------');
      lines.push('');

      process.stderr.write(lines.join('\n'));
    }
  }

  writeState(statePath, state);
  process.exit(0);
}

main().catch((err) => {
  process.stderr.write('agent-suggester: ' + err.message + '\n');
  process.exit(0);
});
