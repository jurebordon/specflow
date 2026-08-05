#!/usr/bin/env node
// Hook: PreToolUse (matcher: Write|Edit)
// Blocks edits to frozen documentation files (VISION.md, feature SPEC.md).
//
// The docs path comes from .specflow/config.md.

const path = require('path');
const fs = require('fs');
const specflow = require('./specflow-config');

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  const data = JSON.parse(input);

  const toolInput = data.tool_input || {};
  const filePath = toolInput.file_path || toolInput.path || '';
  if (!filePath) process.exit(0);

  const cwd = data.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const cfg = specflow.load(cwd);
  if (!cfg) process.exit(0); // Not a SpecFlow project — block nothing.

  const docsAbs = specflow.docsPath(cfg);
  const docsRel = specflow.docsPathRelative(cfg) || 'docs';
  if (!docsAbs) process.exit(0);

  const resolved = path.resolve(filePath);
  const inDocs = resolved === docsAbs || resolved.startsWith(docsAbs + path.sep);
  if (!inDocs) process.exit(0);

  // VISION.md — frozen once populated. Match the docs-root file exactly; a
  // nested <docs>/archive/VISION.md is a different document and not frozen.
  if (resolved === path.join(docsAbs, 'VISION.md')) {
    if (!fs.existsSync(resolved)) process.exit(0); // Creation is allowed.

    const content = fs.readFileSync(resolved, 'utf-8');
    // A skeleton is still awaiting its first real content; let init populate it.
    if (content.includes('TODO') || content.includes('specflow-init will populate')) {
      process.exit(0);
    }

    process.stderr.write(
      'BLOCKED: ' + docsRel + '/VISION.md is frozen. ' +
      'This file requires explicit user approval before editing. ' +
      'Ask the user for permission first.\n'
    );
    process.exit(2);
  }

  // Feature SPEC.md — requirements sections are frozen.
  const rel = path.relative(docsAbs, resolved).split(path.sep);
  if (rel.length === 3 && rel[0] === 'feature_docs' && rel[2] === 'SPEC.md') {
    process.stderr.write(
      'BLOCKED: Feature SPEC.md files have frozen requirements sections. ' +
      'Modifications require explicit user approval. ' +
      'Ask the user for permission first.\n'
    );
    process.exit(2);
  }

  process.exit(0);
}

main().catch((err) => {
  process.stderr.write('doc-file-blocker: ' + err.message + '\n');
  process.exit(0);
});
