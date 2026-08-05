// Shared config reader for SpecFlow hooks.
//
// Hooks execute outside the agent, so they parse `.specflow/config.md` rather
// than reading it the way a skill does. Because the anchor path is fixed and
// never configurable, a hook can locate the config from any working directory
// with no per-project setup — which is why hooks ship verbatim and are copied,
// not rendered.
//
// Every function here is total: it returns null or a default rather than
// throwing. A hook must never break a session because config is missing or
// malformed.

const fs = require('fs');
const path = require('path');

const ANCHOR = path.join('.specflow', 'config.md');

/**
 * Walk up from startDir looking for the config anchor. Falls back to a
 * directory containing .git so callers can still resolve the repo root when
 * the project is not initialised.
 *
 * @returns {Object|null} `{ root, configPath }`, or null when neither is found.
 */
function findRoot(startDir) {
  try {
    let dir = path.resolve(startDir || process.cwd());
    let gitRoot = null;

    for (;;) {
      const candidate = path.join(dir, ANCHOR);
      if (fs.existsSync(candidate)) return { root: dir, configPath: candidate };
      if (!gitRoot && fs.existsSync(path.join(dir, '.git'))) gitRoot = dir;

      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }

    return gitRoot ? { root: gitRoot, configPath: null } : null;
  } catch (_) {
    return null;
  }
}

/**
 * Parse the config into scalars and command lists.
 *
 * Scalars are keyed by bare name ("Docs Path"), not "Section > Key". Schema 0
 * put Format/Typecheck Command under different headings in different projects,
 * so matching on the key name alone is deliberate.
 *
 * @returns {Object|null} `{ root, configPath, scalars, commands, schema }`.
 */
function load(startDir) {
  const found = findRoot(startDir);
  if (!found || !found.configPath) return null;

  let text;
  try {
    text = fs.readFileSync(found.configPath, 'utf-8');
  } catch (_) {
    return null;
  }

  const scalars = Object.create(null);
  const commands = Object.create(null);
  let inCommands = false;
  let bucket = null;

  for (const line of text.split('\n')) {
    const h2 = line.match(/^##\s+(.+?)\s*$/);
    if (h2) {
      inCommands = h2[1].toLowerCase() === 'commands';
      bucket = null;
      continue;
    }

    const h3 = line.match(/^###\s+(.+?)\s*$/);
    if (h3 && inCommands) {
      bucket = h3[1].trim();
      commands[bucket] = commands[bucket] || [];
      continue;
    }

    const scalar = line.match(/^-\s+\*\*(.+?)\*\*:\s*(.*)$/);
    if (scalar) {
      scalars[scalar[1].trim()] = scalar[2].trim();
      continue;
    }

    if (inCommands && bucket) {
      const item = line.match(/^-\s+`(.+)`\s*$/) || line.match(/^-\s+(.+?)\s*$/);
      // Skip the "None recorded."-style placeholder and angle-bracket fill-ins.
      if (item && !/^</.test(item[1]) && !/^none\b/i.test(item[1])) {
        commands[bucket].push(item[1]);
      }
    }
  }

  const rawSchema = parseInt(scalars['Config Schema'], 10);

  return {
    root: found.root,
    configPath: found.configPath,
    scalars,
    commands,
    schema: Number.isNaN(rawSchema) ? null : rawSchema
  };
}

/**
 * Absolute path to the docs directory, or null when unknown.
 * Tolerates a trailing slash — existing projects are inconsistent.
 */
function docsPath(cfg) {
  if (!cfg) return null;
  const raw = cfg.scalars['Docs Path'] || cfg.scalars['Path'];
  if (!raw || /^</.test(raw)) return null;
  return path.join(cfg.root, raw.replace(/\/+$/, ''));
}

/** Docs directory relative to the repo root, for use in messages. */
function docsPathRelative(cfg) {
  if (!cfg) return null;
  const raw = cfg.scalars['Docs Path'] || cfg.scalars['Path'];
  if (!raw || /^</.test(raw)) return null;
  return raw.replace(/\/+$/, '');
}

/**
 * Command list for a category ("Test", "Lint", "Build", "Typecheck", "Format").
 * Always an array, empty when unconfigured.
 */
function commandList(cfg, kind) {
  if (!cfg || !cfg.commands) return [];
  return cfg.commands[kind] || [];
}

/** Absolute path to a config-declared file key, or a fallback under docs. */
function docFile(cfg, key, fallbackName) {
  if (!cfg) return null;
  const raw = cfg.scalars[key];
  if (raw && !/^</.test(raw)) return path.join(cfg.root, raw);
  const docs = docsPath(cfg);
  return docs && fallbackName ? path.join(docs, fallbackName) : null;
}

module.exports = {
  ANCHOR,
  findRoot,
  load,
  docsPath,
  docsPathRelative,
  commandList,
  docFile
};
