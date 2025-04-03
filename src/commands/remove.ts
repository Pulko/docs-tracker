import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { Mapping } from '../core/mapping';

export const removeCommand = new Command('remove')
  .alias('-r')
  .description('Remove a documentation mapping')
  .argument('<index>', 'Index of the mapping to remove (use list command to see indices)')
  .action(async (indexStr: string) => {
    try {
      const index = parseInt(indexStr, 10) - 1;
      
      if (isNaN(index)) {
        throw new Error('Invalid index. Please provide a valid number.');
      }

      const configPath = path.join(process.cwd(), '.doc-tracker');
      
      if (!await fs.pathExists(configPath)) {
        throw new Error('No mappings found');
      }

      const records = await Mapping.fromFile(configPath);
      
      if (index < 0 || index >= records.length) {
        throw new Error(`Invalid index. Please provide a number between 1 and ${records.length}`);
      }

      const removedMapping = records[index];
      records.splice(index, 1);
      await Mapping.saveToFile(configPath, records);

      console.log(`✅ Removed mapping: ${removedMapping.source.file} -> ${removedMapping.target.file}`);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }); 