import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';

interface MappingConfig {
  mappings: Array<{
    source: string;
    target: string;
  }>;
}

export const removeCommand = new Command('remove')
  .description('Remove a documentation mapping')
  .argument('<index>', 'Index of the mapping to remove (use list command to see indices)')
  .action(async (indexStr: string) => {
    try {
      const index = parseInt(indexStr, 10) - 1;
      
      if (isNaN(index)) {
        throw new Error('Invalid index. Please provide a valid number.');
      }

      const configPath = path.join(process.cwd(), 'doc-tracker.json');
      
      if (!await fs.pathExists(configPath)) {
        throw new Error('No mappings found');
      }

      const config: MappingConfig = await fs.readJson(configPath);
      
      if (index < 0 || index >= config.mappings.length) {
        throw new Error(`Invalid index. Please provide a number between 1 and ${config.mappings.length}`);
      }

      const removedMapping = config.mappings.splice(index, 1)[0];
      await fs.writeJson(configPath, config, { spaces: 2 });

      console.log(`✅ Removed mapping: ${removedMapping.source} -> ${removedMapping.target}`);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }); 