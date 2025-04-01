import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';

interface MappingConfig {
  mappings: Array<{
    source: string;
    target: string;
  }>;
}

export const listCommand = new Command('list')
  .description('List all documentation mappings')
  .action(async () => {
    try {
      const configPath = path.join(process.cwd(), 'doc-tracker.json');
      const exists = await fs.pathExists(configPath);

      if (!exists) {
        console.log('No documentation mappings found.');
        return;
      }

      const config = await fs.readJson(configPath);

      if (!config.mappings || config.mappings.length === 0) {
        console.log('No documentation mappings found.');
        return;
      }

      console.log('Documentation Mappings:');
      console.log('=====================');
      config.mappings.forEach((mapping: { source: string; target: string }, index: number) => {
        console.log(`${index + 1}. ${mapping.source} -> ${mapping.target}`);
      });
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }); 