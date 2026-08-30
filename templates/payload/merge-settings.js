#!/usr/bin/env node
//
// Merge SpecFlow's hook wiring into a project's existing .claude/settings.json.
//
// This is the one payload file that reliably contains something the user put
// there -- permissions, env, model choice. Three independent audit runs never
// exercised the merge, because every project tested either gitignored
// settings.json or did not have one, so both took the "create it" branch. A
// merge described only in prose, on the one file that can destroy user data,
// is the wrong place to rely on an agent reading carefully.
//
// Usage:
//   node merge-settings.js <existing-settings.json> <payload-hooks.json>
//   node merge-settings.js --none <payload-hooks.json>     # no existing file
//
// Prints the merged JSON. Writes nothing.

const fs = require('fs');

/** Is this hook entry one SpecFlow installed? */
function isSpecflowHook(entry) {
  return typeof entry?.command === 'string' && entry.command.includes('.claude/hooks/');
}

/**
 * Merge one event's hook groups.
 *
 * Keeps every hook the user added, replaces SpecFlow's own, and does not
 * duplicate on re-run. Matching on the .claude/hooks/ path rather than on
 * exact command text means a renamed hook (session-start-context.js ->
 * .cjs) is replaced rather than left alongside its successor.
 */
function mergeEvent(existingGroups = [], incomingGroups = []) {
  const userGroups = existingGroups
    .map((group) => ({ ...group, hooks: (group.hooks || []).filter((h) => !isSpecflowHook(h)) }))
    .filter((group) => group.hooks.length > 0);

  return [...userGroups, ...incomingGroups];
}

function merge(existing, incoming) {
  // Start from the user's file so anything SpecFlow does not ship -- permissions,
  // env, model, statusLine overrides they wrote -- survives untouched.
  const out = { ...existing };

  const events = new Set([...Object.keys(existing.hooks || {}), ...Object.keys(incoming.hooks || {})]);
  if (events.size > 0) {
    out.hooks = {};
    for (const event of events) {
      const merged = mergeEvent(existing.hooks?.[event], incoming.hooks?.[event]);
      if (merged.length > 0) out.hooks[event] = merged;
    }
  }

  // The statusline is entirely SpecFlow's; replace it outright.
  if (incoming.statusLine) out.statusLine = incoming.statusLine;

  return out;
}

if (require.main === module) {
  const [existingPath, incomingPath] = process.argv.slice(2);
  if (!incomingPath) {
    console.error('usage: merge-settings.js <existing-settings.json|--none> <payload-hooks.json>');
    process.exit(2);
  }

  let existing = {};
  if (existingPath !== '--none') {
    try {
      existing = JSON.parse(fs.readFileSync(existingPath, 'utf-8'));
    } catch (err) {
      console.error(`Could not read ${existingPath}: ${err.message}`);
      console.error('Refusing to merge into a file that cannot be parsed -- fix or move it first.');
      process.exit(3);
    }
  }

  const incoming = JSON.parse(fs.readFileSync(incomingPath, 'utf-8'));
  console.log(JSON.stringify(merge(existing, incoming), null, 2));
}

module.exports = { merge, mergeEvent, isSpecflowHook };
