import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { Mapping } from '../core/mapping';

export const listCommand = new Command('list')
  .alias('-l')
  .description('List all documentation mappings')
  .action(async () => {
    try {
      const configPath = path.join(process.cwd(), '.doc-tracker');
      const exists = await fs.pathExists(configPath);

      if (!exists) {
        console.log('No documentation mappings found.');
        return;
      }

      const records = await Mapping.fromFile(configPath);

      if (!records || records.length === 0) {
        console.log('No documentation mappings found.');
        return;
      }

      console.log('Documentation Mappings:');
      console.log('=====================');
      records.forEach((record, index) => {
        const sourceStr = `${record.source.file}:${record.source.isCharacterRange ? 
          `${record.source.line}@${record.source.startChar}-${record.source.endChar}` : 
          `${record.source.startLine}-${record.source.endLine}`}`;
        const targetStr = `${record.target.file}:${record.target.isCharacterRange ? 
          `${record.target.line}@${record.target.startChar}-${record.target.endChar}` : 
          `${record.target.startLine}-${record.target.endLine}`}`;
        console.log(`${index + 1}. ${sourceStr} -> ${targetStr}`);
      });
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }); 