#!/usr/bin/env node

/**
 * Copies templates and configuration from the repo root into cli/templates/
 * so they get bundled into the npm package.
 * Runs as prepublishOnly hook.
 */

import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliRoot = resolve(__dirname, '..');
const repoRoot = resolve(cliRoot, '..');
const dest = resolve(cliRoot, 'templates');

// Clean previous bundle
if (existsSync(dest)) {
  rmSync(dest, { recursive: true });
}

mkdirSync(dest, { recursive: true });

// Copy templates/ and configuration/ from repo root
cpSync(resolve(repoRoot, 'templates'), resolve(dest, 'templates'), { recursive: true });
cpSync(resolve(repoRoot, 'configuration'), resolve(dest, 'configuration'), { recursive: true });

console.log('Bundled templates and configuration into cli/templates/');
