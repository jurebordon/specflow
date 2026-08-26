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
const { execFileSync } = require('child_process');

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

/**
 * `npm run lint --fix` gives `--fix` to npm, not to the script. The script sees
 * no arguments at all, so the command runs, exits 0, and does nothing.
 *
 * A real project carried exactly this as its formatter through a 1.x config and
 * had been formatting nothing for months. Exit status is not evidence that a
 * command did its job.
 */
function swallowedNpmFlag(command) {
  const m = command.match(/npm run [\w:.-]+\s+(--?[\w-]+)/);
  if (!m || / -- /.test(command)) return null;
  return { flag: m[1], suggestion: command.replace(/(npm run [\w:.-]+)\s+/, '$1 -- ') };
}

function uniq(list) {
  return [...new Set(list.filter(Boolean))];
}


/**
 * Would the anchor be invisible to git?
 *
 * 1.x's own setup docs told people to add `.specflow/` to .gitignore, and real
 * projects did. Schema 1 requires the anchor to be tracked: ignored, the config
 * is invisible to teammates and CI, and every skill on another machine reports
 * "not initialised" forever with nothing to explain why.
 *
 * Checked here rather than left to the agent because it is silent and total --
 * nothing downstream errors, it simply never works.
 */
function anchorIgnored(repo) {
  try {
    execFileSync('git', ['check-ignore', '-q', '.specflow/config.md'], { cwd: repo, stdio: 'ignore' });
    return true; // exit 0 means "is ignored"
  } catch {
    return false;
  }
}

/** Which .gitignore line does it, so the report can name it. */
function ignoreRule(repo) {
  try {
    const out = execFileSync('git', ['check-ignore', '-v', '.specflow/config.md'], { cwd: repo, encoding: 'utf-8' });
    return out.trim().split('\t')[0];
  } catch {
    return null;
  }
}

/**
 * Commands the project has that the legacy config never recorded.
 *
 * Schema 0 held one command per category, so a monorepo's second suite went
 * unrecorded -- the defect list-valued commands exist to fix. Leaving detection
 * to "the agent should notice" reproduces it, so it is mechanical here. These
 * are candidates, not conclusions: the caller confirms them.
 */
function detectCommands(repo) {
  const found = { Test: [], Lint: [], Build: [], Typecheck: [], Format: [] };
  // Scripts that never exit on their own. Proposing one puts a command into
  // the config that start-session is told to run every time, and the session
  // hangs. A watcher or an interactive UI is not a verification command.
  const NON_TERMINATING = /(^|[:.-])(ui|watch|serve|dev|debug)$/;

  const SCRIPT_MAP = {
    Test: /^(test|tests|test:.*|e2e|test-e2e)$/,
    Lint: /^(lint|lint:.*)$/,
    Build: /^(build|build:.*)$/,
    Typecheck: /^(typecheck|type-check|tsc)$/,
    Format: /^(format|fmt|prettier)$/
  };

  const walk = (dir, depth) => {
    if (depth > 2) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    const rel = path.relative(repo, dir);
    const prefix = rel ? `cd ${rel} && ` : '';

    for (const entry of entries) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (['node_modules', '.git', 'venv', '.venv', '__pycache__', 'dist', 'build', 'target'].includes(entry.name)) continue;
        walk(abs, depth + 1);
        continue;
      }

      if (entry.name === 'package.json') {
        try {
          const scripts = JSON.parse(fs.readFileSync(abs, 'utf-8')).scripts || {};
          for (const name of Object.keys(scripts)) {
            if (NON_TERMINATING.test(name)) continue;
            for (const [kind, re] of Object.entries(SCRIPT_MAP)) {
              // `npm run x --flag` gives the flag to npm, not the script, so a
              // detected script is recorded bare.
              if (re.test(name)) found[kind].push(`${prefix}npm run ${name}`);
            }
          }
        } catch {
          // Unparseable manifest is not our problem to report here.
        }
      }

      if (entry.name === 'pytest.ini' || entry.name === 'tox.ini') found.Test.push(`${prefix}pytest`);
      if (entry.name === 'pyproject.toml') {
        try {
          if (/\[tool\.pytest/.test(fs.readFileSync(abs, 'utf-8'))) found.Test.push(`${prefix}pytest`);
        } catch { /* ignore */ }
      }
    }
  };

  walk(repo, 0);
  for (const k of Object.keys(found)) found[k] = uniq(found[k]);
  return found;
}

/**
 * Repo-level checks that do not depend on a legacy config existing.
 *
 * Kept separate so fresh mode can run them: the anchor-gitignored check used to
 * live inside migrate(), which only runs on parsed legacy text, so it could
 * never fire on a project that had never used SpecFlow -- the case the skill's
 * own text calls "the common case, not the edge case".
 */
function preflight(repo) {
  const blockers = [];
  if (anchorIgnored(repo)) {
    blockers.push({
      id: 'anchor_gitignored',
      rule: ignoreRule(repo),
      why: 'git ignores .specflow/config.md, so the anchor would be invisible to teammates and CI',
      consequence: 'every skill on another machine reports "not initialised" forever, with nothing to explain why',
      fix: 'remove that .gitignore rule (1.x setup docs added it; schema 1 requires the anchor tracked)'
    });
  }
  return blockers;
}

function reportBlockers(blockers) {
  for (const b of blockers) {
    console.error(`\nBLOCKER (${b.id}): ${b.why}`);
    if (b.rule) console.error(`  rule: ${b.rule}`);
    console.error(`  consequence: ${b.consequence}`);
    console.error(`  fix: ${b.fix}`);
  }
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
  const blockers = [];

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
  const PATH_KEYS = new Set(['Existing Docs']);
  for (const key of mig.carried_keys) {
    const name = key.split('>').pop().trim();
    if (!scalars[name]) continue;
    // CONFIG_SCHEMA's normalisation rule is "writers emit the bare form", and
    // it applies to every path value, not just Docs Path.
    out[name] = PATH_KEYS.has(name) ? scalars[name].replace(/\/+$/, '') : scalars[name];
  }

  // -- constrained value spaces --------------------------------------------
  //
  // Some keys did not just move between schemas, their vocabulary changed.
  // Carrying such a value through verbatim produces a config that every
  // consumer silently fails to match: the project gets no workflow
  // instructions, or a ticketing system that does not exist, and nothing
  // reports an error. The mapping table lives in the manifest so this code and
  // the tests read the same source.
  for (const [key, spec] of Object.entries(mig.value_spaces || {})) {
    if (key.startsWith('_')) continue;

    const raw = scalars[spec.scalar];
    if (raw === undefined || raw === '') continue;

    const found = raw.trim();
    const lookup = spec.case_insensitive ? found.toLowerCase() : found;
    const mapped = spec.map[lookup];

    if (mapped !== undefined) {
      out[spec.scalar] = mapped;
      if (mapped !== found) notes.push(`normalised ${spec.scalar} "${found}" to "${mapped}"`);
      if (spec.lossy && spec.lossy[lookup]) notes.push(spec.lossy[lookup]);
    } else if (spec.free_form) {
      // A value SpecFlow does not know by name is still legitimate here.
      out[spec.scalar] = found;
      notes.push(`kept unrecognised ${spec.scalar} "${found}" verbatim`);
    } else {
      decisions.push({
        id: spec.on_unmapped,
        deferrable: false,
        found,
        why: `schema 1 accepts only ${spec.accepted.join(', ')} for ${spec.scalar}`
      });
    }
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

  // -- blockers: things that make the result unusable if written as-is ------
  const repoDir = opts.repo || process.cwd();
  blockers.push(...preflight(repoDir));

  // -- command candidates the legacy config never recorded ------------------
  const candidates = detectCommands(repoDir);
  for (const [kind, list] of Object.entries(candidates)) {
    const missing = list.filter((c) => !commands[kind].includes(c));
    if (missing.length) {
      decisions.push({
        id: 'command_lists',
        key: kind,
        deferrable: true,
        detected_not_recorded: missing,
        why: 'the project has this command but the schema 0 config never recorded it; confirm whether it belongs'
      });
    }
  }

  // Commands that run cleanly but do nothing.
  for (const [kind, list] of Object.entries(commands)) {
    for (const command of list) {
      const swallowed = swallowedNpmFlag(command);
      if (!swallowed) continue;
      decisions.push({
        id: 'command_lists',
        key: kind,
        deferrable: false,
        command,
        why: `npm gives ${swallowed.flag} to itself, not to the script, so this runs and does nothing`,
        suggestion: swallowed.suggestion
      });
    }
  }

  const unresolved = decisions.some((d) => d.deferrable === false) || blockers.length > 0;

  return { out, commands, decisions, notes, blockers, candidates, writable: !unresolved };
}

function render(result, version) {
  const { out, commands } = result;
  const banner = result.writable === false
    ? '<!-- PROPOSAL ONLY — unresolved markers below. Do not write this to\n     .specflow/config.md until every <angle bracket> and UNVERIFIED line is\n     replaced. See --json for what is outstanding. -->\n\n'
    : '';
  const list = (k) => (commands[k].length ? commands[k].map((c) => '- `' + c + '`').join('\n') : '');
  const v = (k, fallback) => out[k] || fallback;

  return `${banner}# SpecFlow Project Configuration

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
- **Docs Path**: ${v('Docs Path', '<docs>')}${out['Existing Docs'] ? `\n- **Existing Docs**: ${out['Existing Docs']}` : ''}
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
<!--
  UNVERIFIED: migration does not run your tests, so no baseline was established.
  Run every command under ### Test, then either record each failure with its
  message, or replace this block with "- None recorded." if the suite is green.
  Do not leave this as-is: a baseline nobody verified is worse than none.
-->
- UNVERIFIED: no test run was performed during migration.

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
  // Parse properly: a flag's value is also a non-flag argument, so scanning
  // for "the first thing without --" hands back --repo's value when the
  // positional is omitted -- which is exactly what a fresh-mode run does.
  const VALUE_FLAGS = new Set(['--repo', '--version-string']);
  const positional = [];
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (VALUE_FLAGS.has(args[i])) { flags[args[i]] = args[++i]; continue; }
    if (args[i].startsWith('--')) { flags[args[i]] = true; continue; }
    positional.push(args[i]);
  }

  const legacyPath = positional[0];
  const repo = flags['--repo'] || (legacyPath ? path.dirname(path.dirname(legacyPath)) : process.cwd());

  // --check runs the repo-level preflight alone. Fresh mode has no legacy
  // config, so routing the anchor check through migrate() made it unreachable
  // on exactly the projects the check exists for.
  if (flags['--check']) {
    const blockers = preflight(repo);
    if (flags['--json']) console.log(JSON.stringify({ blockers, writable: blockers.length === 0 }, null, 2));
    reportBlockers(blockers);
    process.exit(blockers.length ? 3 : 0);
  }

  if (!legacyPath || !fs.existsSync(legacyPath) || fs.statSync(legacyPath).isDirectory()) {
    console.error('usage: migrate-config.js <legacy-config-path> [--repo <dir>] [--json]');
    console.error('       migrate-config.js --check --repo <dir> [--json]   (repo preflight, no legacy config)');
    process.exit(2);
  }

  const version = typeof flags['--version-string'] === 'string' ? flags['--version-string'] : '2.0.0';

  const result = migrate(fs.readFileSync(legacyPath, 'utf-8'), { repo });

  if (args.includes('--json')) {
    console.log(JSON.stringify({
      blockers: result.blockers,
      writable: result.writable,
      decisions: result.decisions,
      notes: result.notes,
      commands: result.commands,
      candidates: result.candidates
    }, null, 2));
  } else {
    console.log(render(result, version));
  }

  if (result.blockers.length > 0) {
    reportBlockers(result.blockers);
    process.exit(3);
  }
}

module.exports = { parseLegacy, migrate, render, preflight, detectCommands };
