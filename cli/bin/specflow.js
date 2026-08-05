#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { program } from 'commander';
import chalk from 'chalk';
import { install } from '../src/install.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf-8'));

program
  .name('specflow')
  .description('SpecFlow - spec-driven framework for AI-assisted development')
  .version(pkg.version);

program
  .command('install')
  .description('Install SpecFlow skills into ~/.claude/skills/ (once per machine)')
  .option('--dry-run', 'Show what would be installed without writing')
  .option('--force', 'Replace same-named skills SpecFlow did not install')
  .action(install);

program
  .command('update')
  .description('Update the machine-level skills to this version')
  .option('--dry-run', 'Show what would change without writing')
  .option('--force', 'Replace same-named skills SpecFlow did not install')
  .action(install);

program
  .command('init')
  .description('(removed) Project setup is now the specflow-init skill')
  .action(() => {
    console.log('');
    console.log(chalk.yellow('`specflow init` has been removed.'));
    console.log('');
    console.log('Project setup is no longer done by the CLI. It is done by an agent, which');
    console.log('can read your codebase and write real documentation rather than leaving');
    console.log('empty templates behind.');
    console.log('');
    console.log(`  1. ${chalk.cyan('specflow install')}   — once per machine`);
    console.log(`  2. ${chalk.cyan('specflow-init')}      — run this skill inside each project`);
    console.log('');
    console.log(chalk.dim('Existing projects are migrated by specflow-init, which carries your'));
    console.log(chalk.dim('current .specflow-config.md values forward. Nothing is lost.'));
    console.log('');
    process.exitCode = 1;
  });

program.parse();
