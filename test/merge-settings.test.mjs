/**
 * The settings.json merge.
 *
 * Three independent audit runs never exercised this path -- every project
 * tested either gitignored settings.json or did not have one, so all three took
 * the "create it" branch. It is also the one payload file that reliably holds
 * something the user put there, so it gets tests rather than prose.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PAYLOAD } from './helpers.mjs';

const require = createRequire(import.meta.url);
const { merge, isSpecflowHook } = require(join(PAYLOAD, 'merge-settings.js'));
const PAYLOAD_SETTINGS = JSON.parse(readFileSync(join(PAYLOAD, 'settings', 'hooks.json'), 'utf-8'));

const userHook = (cmd) => ({ type: 'command', command: cmd });

describe('merge-settings', () => {
  test('keeps every key SpecFlow does not ship', () => {
    const user = {
      permissions: { allow: ['Bash(npm test)'], deny: ['Bash(rm -rf *)'] },
      env: { DEBUG: '1' },
      model: 'opus'
    };
    const out = merge(user, PAYLOAD_SETTINGS);

    assert.deepEqual(out.permissions, user.permissions, 'permissions must survive');
    assert.deepEqual(out.env, user.env);
    assert.equal(out.model, 'opus');
  });

  test('keeps a hook the user added on an event SpecFlow also uses', () => {
    const user = { hooks: { SessionStart: [{ hooks: [userHook('node my-own.js')] }] } };
    const out = merge(user, PAYLOAD_SETTINGS);

    const commands = out.hooks.SessionStart.flatMap((g) => g.hooks).map((h) => h.command);
    assert.ok(commands.includes('node my-own.js'), "the user's own hook was dropped");
    assert.ok(commands.some((c) => c.includes('session-start-context.cjs')));
  });

  test('replaces a stale SpecFlow hook rather than duplicating it', () => {
    // 1.x wired .js; 2.0 ships .cjs. Matching on exact command text would
    // leave both, and the dead one would still be invoked.
    const user = { hooks: { SessionStart: [{ hooks: [userHook('node .claude/hooks/session-start-context.js')] }] } };
    const out = merge(user, PAYLOAD_SETTINGS);

    const commands = JSON.stringify(out);
    assert.ok(!commands.includes('session-start-context.js"'), 'stale .js hook survived');
    assert.ok(commands.includes('session-start-context.cjs'));
  });

  test('is idempotent', () => {
    const once = merge({ permissions: { allow: ['x'] } }, PAYLOAD_SETTINGS);
    const twice = merge(once, PAYLOAD_SETTINGS);
    assert.deepEqual(twice, once, 're-running must not accumulate entries');
  });

  test('replaces statusLine outright', () => {
    const out = merge({ statusLine: { type: 'command', command: 'node .claude/statusline.js' } }, PAYLOAD_SETTINGS);
    assert.match(out.statusLine.command, /statusline\.cjs/);
  });

  test('handles an absent settings.json', () => {
    const out = merge({}, PAYLOAD_SETTINGS);
    assert.ok(out.hooks.SessionStart);
    assert.ok(out.statusLine);
  });

  test('drops an event group left empty, rather than writing a husk', () => {
    const user = { hooks: { Stop: [{ hooks: [userHook('node .claude/hooks/gone.js')] }] } };
    const out = merge(user, { hooks: {} });
    assert.ok(!out.hooks.Stop, 'an event whose only hooks were SpecFlow\'s should disappear');
  });

  test('identifies SpecFlow hooks by path, not exact text', () => {
    assert.ok(isSpecflowHook({ command: 'node .claude/hooks/anything.cjs' }));
    assert.ok(!isSpecflowHook({ command: 'node scripts/mine.js' }));
    assert.ok(!isSpecflowHook({}));
  });
});
