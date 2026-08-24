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
 * Walk up from startDir looking for the config anchor, stopping at the first
 * repository boundary.
 *
 * The walk must not cross a `.git`: a nested repository or submodule that has
 * no config of its own is uninitialised, and inheriting the parent repo's
 * config would point its hooks at another project's docs. Stopping there
 * yields `configPath: null`, which every caller treats as "not a SpecFlow
 * project" and no-ops on.
 *
 * @returns {Object|null} `{ root, configPath }`, or null when neither is found.
 */
function findRoot(startDir) {
  try {
    let dir = path.resolve(startDir || process.cwd());

    for (;;) {
      const candidate = path.join(dir, ANCHOR);
      if (fs.existsSync(candidate)) return { root: dir, configPath: candidate };

      // Repository boundary — do not inherit a parent repo's config.
      if (fs.existsSync(path.join(dir, '.git'))) return { root: dir, configPath: null };

      const parent = path.dirname(dir);
      if (parent === dir) return null;
      dir = parent;
    }
  } catch (_) {
    return null;
  }
}

/**
 * Resolve a config-supplied path against the repo root, refusing anything that
 * escapes it.
 *
 * Config values are meant to be trusted, but a stray `../` — from a hand edit
 * or a bad migration — would otherwise let a hook read, write or block files
 * in an unrelated directory. Returns null rather than throwing.
 */
function safeResolve(root, value) {
  if (!value || typeof value !== 'string') return null;
  if (/^</.test(value.trim())) return null; // unfilled <angle bracket> placeholder

  try {
    const resolved = path.resolve(root, value.trim().replace(/\/+$/, ''));
    if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;
    return resolved;
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

  const scalars = Object.create(null);   // bare key -> value (last wins)
  const qualified = Object.create(null); // "Section > Key" -> value
  const commands = Object.create(null);
  let inCommands = false;
  let section = '';
  let bucket = null;

  for (const line of text.split('\n')) {
    const h2 = line.match(/^##\s+(.+?)\s*$/);
    if (h2) {
      section = h2[1].trim();
      inCommands = section.toLowerCase() === 'commands';
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
      const key = scalar[1].trim();
      const value = scalar[2].trim();
      scalars[key] = value;
      if (section) qualified[`${section} > ${key}`] = value;
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
    qualified,
    commands,
    schema: Number.isNaN(rawSchema) ? null : rawSchema
  };
}

/**
 * Read a value by its full "Section > Key" name.
 *
 * Prefer this over `scalars` wherever the schema defines the same bare key in
 * more than one section. It defines `Mode` twice -- `Project > Mode` and
 * `Review Gate > Mode` -- and bare-name lookup silently returns whichever came
 * last in the file, so asking for the project mode answers "codex". `Notes` has
 * the same exposure.
 *
 * `scalars` still exists, and still matches on the bare name, because schema 0
 * put the same key under different headings in different projects and migration
 * has to tolerate that. For reading a schema 1 config, use this.
 */
function get(cfg, qualifiedKey) {
  if (!cfg) return undefined;
  return cfg.qualified?.[qualifiedKey];
}

/**
 * Absolute path to the docs directory, or null when unknown.
 * Tolerates a trailing slash — existing projects are inconsistent.
 */
function docsPath(cfg) {
  if (!cfg) return null;
  return safeResolve(cfg.root, cfg.scalars['Docs Path'] || cfg.scalars['Path']);
}

/** Docs directory relative to the repo root, for use in messages. */
function docsPathRelative(cfg) {
  const abs = docsPath(cfg);
  if (!abs) return null;
  return path.relative(cfg.root, abs) || '.';
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
  const declared = safeResolve(cfg.root, cfg.scalars[key]);
  if (declared) return declared;
  const docs = docsPath(cfg);
  return docs && fallbackName ? path.join(docs, fallbackName) : null;
}

module.exports = {
  ANCHOR,
  get,
  findRoot,
  safeResolve,
  load,
  docsPath,
  docsPathRelative,
  commandList,
  docFile
};
