#!/usr/bin/env node
//
// Deterministic schema 0 -> 1 config migration.
//
// specflow-init runs this for the parts the manifest marks `auto`, then
// interviews for the `decision` parts. Doing the mechanical half in code
// rather than by improvisation matters: every skill reads this file, and a
// key silently dropped here fails later at the point of use, with no error
// pointing back to the migration.
//
// Usage:
//   node migrate-config.js <legacy-config-path> [--repo <dir>] [--json]
//
// Writes nothing. Prints the proposed schema-1 config (or JSON with the
// unresolved decisions) for the caller to review and write.

const fs = require('fs');
const path = require('path');

/**
 * Locate the migration manifest in either layout: installed (this script sits
 * at <skill>/payload/, manifest at <skill>/migrations/) or a source checkout
 * (templates/payload/ and configuration/migrations/).
 */
function findManifest() {
  const candidates = [
    path.join(__dirname, '..', 'migrations', 'manifest.json'),
    path.join(__dirname, '..', '..', 'configuration', 'migrations', 'manifest.json')
  ];
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) {
    throw new Error('migration manifest not found; looked in:\n  ' + candidates.join('\n  '));
  }
  return found;
}

/**
 * Parse a schema-0 config.
 *
 * Two shapes exist in the wild and both must be handled:
 *   - `- **Test Command**: cd backend && pytest`          (scalar)
 *   - `- **Test Commands**:` followed by indented
 *     `  - Python: pytest` sub-bullets                    (mixed-stack)
 *
 * The second is the one that loses data if treated as a scalar: the key line
 * has an empty value, so a naive parser records "" and drops every command
 * beneath it. That shape is also the only schema-0 form that already held
 * multiple commands per category -- exactly what schema 1 exists to keep.
 */
function parseLegacy(text) {
  const scalars = Object.create(null);
  const sublists = Object.create(null);
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^-\s+\*\*(.+?)\*\*:\s*(.*)$/);
    if (!m) continue;

    const key = m[1].trim();
    const value = m[2].trim();

    if (value) {
      scalars[key] = value;
      continue;
    }

    // Empty value — collect any indented sub-bullets that follow.
    const items = [];
    for (let j = i + 1; j < lines.length; j++) {
      const sub = lines[j].match(/^\s+-\s+(.+?)\s*$/);
      if (!sub) {
        if (lines[j].trim() === '') continue;
        break;
      }
      // Drop a "Python:" / "DBT:" label, keep the command.
      items.push(sub[1].replace(/^[A-Za-z0-9 _.+-]{1,20}:\s*/, '').trim());
    }
    if (items.length) sublists[key] = items;
    else scalars[key] = '';
  }

  return { scalars, sublists };
}

/** Strip surrounding backticks and any trailing "(description)" noise. */
function cleanCommand(raw) {
  const backticked = raw.match(/`([^`]+)`/);
  return (backticked ? backticked[1] : raw).trim();
}

/**
 * Is this actually a runnable command, or prose someone typed into the field?
 *
 * Schema 0's single-value fields invited sentences. A real project records
 * Build Command as:
 *
 *   n/a (backend has no build step; frontend build command TBD when
 *   scaffolded, e.g. npm run build)
 *
 * Carrying that forward verbatim gives every skill a "command" it will try to
 * execute. Better to surface it as a decision than to write a config that is
 * confidently wrong.
 */
function looksLikeCommand(value) {
  if (!value) return false;
  const v = value.trim();
  if (v.length > 120) return false;
  if (/^(n\/?a\b|none\b|tbd\b|todo\b|-+$)/i.test(v)) return false;
  if (/\b(TBD|when scaffolded|no build step|not applicable)\b/i.test(v)) return false;
  // A sentence: ends in a period and has more words than a command usually does.
  if (/\.\s*$/.test(v) && v.split(/\s+/).length > 6) return false;

  // Short prose is the hard case: "see README", "ask team", "use CI" all look
  // like a two-token command. Nothing about their shape distinguishes them
  // from `npm test`, so discriminate on the leading verb instead -- no build
  // tool is invoked by any of these words.
  const first = v.split(/\s+/)[0].toLowerCase();
  const PROSE_LEADS = new Set([
    'see', 'ask', 'use', 'check', 'refer', 'contact', 'consult', 'read',
    'follow', 'depends', 'varies', 'manual', 'manually', 'unknown',
    'unclear', 'either', 'whatever', 'per', 'via', 'in', 'the', 'a', 'we',
    'you', 'it', 'this', 'that', 'currently', 'usually', 'normally'
  ]);
  if (PROSE_LEADS.has(first) && /\s/.test(v)) return false;

  return true;
}

function uniq(list) {
  return [...new Set(list.filter(Boolean))];
}

function migrate(legacyText, opts = {}) {
  const manifest = JSON.parse(fs.readFileSync(findManifest(), 'utf-8'));
  const mig = manifest.migrations.find((m) => m.from === 0 && m.to === 1);
  if (!mig) throw new Error('manifest has no 0 -> 1 migration');

  const { scalars, sublists } = parseLegacy(legacyText);
  const out = Object.create(null);
  const commands = { Test: [], Lint: [], Build: [], Typecheck: [], Format: [] };
  const decisions = [];
  const notes = [];
  const rejected = [];

  // -- renamed scalars (match on key name; schema 0 put the same key under
  //    different headings in different projects, so section is ignored) -----
  for (const rule of mig.renamed_keys) {
    const names = (rule.from_any_of || [rule.from]).map((k) => k.split('>').pop().trim());
    for (const name of names) {
      if (!(name in scalars) || !scalars[name]) continue;
      const target = rule.to.split('>').pop().trim();
      if (rule.transform === 'scalar_to_list' && target in commands) {
        const cleaned = cleanCommand(scalars[name]);
        if (looksLikeCommand(cleaned)) {
          commands[target].push(cleaned);
        } else {
          rejected.push({ target, value: cleaned });
        }
      } else {
        out[target] = rule.transform === 'strip_trailing_slash'
          ? scalars[name].replace(/\/+$/, '')
          : scalars[name];
      }
      break;
    }
  }

  // -- mixed-stack plural keys ---------------------------------------------
  for (const rule of mig.merged_keys || []) {
    for (const map of rule.mapping) {
      const items = sublists[map.from];
      if (!items) continue;
      const target = map.to.split('>').pop().trim();
      commands[target].push(...items.map(cleanCommand));
      notes.push(`merged ${items.length} command(s) from "${map.from}" into ${target}`);
    }
  }

  for (const k of Object.keys(commands)) commands[k] = uniq(commands[k]);

  // -- carried scalars ------------------------------------------------------
  for (const key of mig.carried_keys) {
    const name = key.split('>').pop().trim();
    if (scalars[name]) out[name] = scalars[name];
  }

  // -- split: "jira (format: PROJ-123)" -> two keys --------------------------
  if (out.Ticketing) {
    const m = out.Ticketing.match(/^(.*?)\s*\(format:\s*(.+?)\)\s*$/i);
    if (m) {
      out.Ticketing = m[1].trim();
      out['Ticket Format'] = m[2].trim();
    }
  }

  // -- derived doc paths, with the manifest's fallback decision -------------
  const docsPath = (out['Docs Path'] || '').replace(/\/+$/, '');
  const repo = opts.repo || process.cwd();
  for (const [key, file] of [['Tasks File', 'ROADMAP.md'], ['Session Log', 'SESSION_LOG.md']]) {
    const candidate = docsPath ? path.join(docsPath, file) : file;
    if (docsPath && fs.existsSync(path.join(repo, candidate))) {
      out[key] = candidate;
    } else {
      decisions.push({ id: 'doc_file_names', key, tried: candidate, deferrable: false });
    }
  }

  // -- decisions the manifest says cannot be derived ------------------------
  for (const r of rejected) {
    decisions.push({
      id: 'command_lists',
      key: r.target,
      deferrable: true,
      rejected_value: r.value,
      why: 'the schema 0 value is prose, not a runnable command; it was not carried forward'
    });
    notes.push(`dropped non-command ${r.target} value: ${JSON.stringify(r.value)}`);
  }

  const emptyLists = Object.entries(commands).filter(([, v]) => v.length === 0).map(([k]) => k);
  if (emptyLists.length) {
    decisions.push({ id: 'command_lists', missing: emptyLists, deferrable: true });
  }
  const singles = Object.entries(commands).filter(([, v]) => v.length === 1).map(([k]) => k);
  if (singles.length) {
    decisions.push({
      id: 'command_lists',
      unconfirmed: singles,
      deferrable: true,
      why: 'carried a single command forward; confirm no suite is missing'
    });
  }
  if (!out['Commit Convention']) decisions.push({ id: 'commit_convention', deferrable: true });
  decisions.push({ id: 'failure_baseline', deferrable: true });
  decisions.push({ id: 'review_gate', deferrable: true, rerunnable: true });

  return { out, commands, decisions, notes };
}

function render(result, version) {
  const { out, commands } = result;
  const list = (k) => (commands[k].length ? commands[k].map((c) => '- `' + c + '`').join('\n') : '');
  const v = (k, fallback) => out[k] || fallback;

  return `# SpecFlow Project Configuration

## SpecFlow
- **Config Schema**: 1
- **SpecFlow Version**: ${version}

## Project
- **Name**: ${v('Name', '<project name>')}
- **Mode**: ${v('Mode', '<greenfield | adoption | constrained>')}
- **Description**: ${v('Description', '')}

## Tech Stack
- **Languages**: ${v('Languages', '')}
- **Frameworks**: ${v('Frameworks', '')}

## Documentation
- **Docs Path**: ${v('Docs Path', '<docs>')}
- **Tasks File**: ${v('Tasks File', '<UNRESOLVED: see decisions>')}
- **Session Log**: ${v('Session Log', '<UNRESOLVED: see decisions>')}
- **Tracking**: ${v('Tracking', 'tracked')}

## Commands

### Test
${list('Test') || '<UNRESOLVED: no test command in the legacy config>'}

### Lint
${list('Lint')}

### Build
${list('Build')}

### Typecheck
${list('Typecheck')}

### Format
${list('Format')}

## Known Test Failures
- None recorded.

## Git Workflow
- **Type**: ${v('Type', 'solo')}
- **Platform**: ${v('Platform', 'none')}
- **Default Branch**: ${v('Default Branch', '<detect from remote HEAD>')}
- **Branch Convention**: ${v('Branch Convention', 'feat/description')}
- **Commit Convention**: ${v('Commit Convention', '<UNCONFIRMED: conventional>')}

## Integrations
- **Ticketing**: ${v('Ticketing', 'none')}
${out['Ticket Format'] ? `- **Ticket Format**: ${out['Ticket Format']}\n` : ''}
## Review Gate
- **Mode**: <UNRESOLVED: probe>
- **Probed**: <YYYY-MM-DD>

## Technical Layers
- **Hooks**: ${v('Hooks', 'enabled')}
- **Rules**: ${v('Rules', 'enabled')}
- **Statusline**: ${v('Statusline', 'enabled')}
`;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const legacyPath = args.find((a) => !a.startsWith('--'));
  const repoIdx = args.indexOf('--repo');
  const repo = repoIdx !== -1 ? args[repoIdx + 1] : path.dirname(path.dirname(legacyPath || '.'));

  if (!legacyPath || !fs.existsSync(legacyPath)) {
    console.error('usage: migrate-config.js <legacy-config-path> [--repo <dir>] [--json]');
    process.exit(2);
  }

  const version = args.includes('--version-string')
    ? args[args.indexOf('--version-string') + 1]
    : '2.0.0';

  const result = migrate(fs.readFileSync(legacyPath, 'utf-8'), { repo });

  if (args.includes('--json')) {
    console.log(JSON.stringify({ decisions: result.decisions, notes: result.notes, commands: result.commands }, null, 2));
  } else {
    console.log(render(result, version));
  }
}

module.exports = { parseLegacy, migrate, render };
