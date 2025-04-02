#!/usr/bin/env node

import { Command } from 'commander';
import { checkCommand } from './commands/check';
import { addCommand } from './commands/add';
import { listCommand } from './commands/list';
import { removeCommand } from './commands/remove';
import fs from 'fs-extra';
import path from 'path';

const program = new Command();

// Read package.json for version and description
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'));

program
  .name('doc-tracker')
  .description(packageJson.description)
  .version(packageJson.version);

program.addCommand(checkCommand);
program.addCommand(addCommand);
program.addCommand(listCommand);
program.addCommand(removeCommand);

program.parse(); 