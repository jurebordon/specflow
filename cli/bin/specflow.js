#!/usr/bin/env node

import { program } from 'commander';
import { init } from '../src/init.js';
import { update } from '../src/update.js';

program
  .name('specflow')
  .description('SpecFlow - spec-driven framework for AI-assisted development')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize SpecFlow in the current project')
  .option('--yes', 'Accept all defaults (non-interactive)')
  .option('--mode <mode>', 'Project mode: greenfield, constrained, adoption')
  .action(init);

program
  .command('update')
  .description('Update templates and commands without overwriting config or docs')
  .action(update);

program.parse();
