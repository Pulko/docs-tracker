#!/usr/bin/env node

import { Command } from 'commander';
import { checkCommand } from './commands/check';
import { addCommand } from './commands/add';
import { listCommand } from './commands/list';
import { removeCommand } from './commands/remove';

const program = new Command();

program
  .name('doc-tracker')
  .description('CLI tool for tracking and managing documentation updates in a codebase')
  .version('1.0.0');

program.addCommand(checkCommand);
program.addCommand(addCommand);
program.addCommand(listCommand);
program.addCommand(removeCommand);

program.parse(); 