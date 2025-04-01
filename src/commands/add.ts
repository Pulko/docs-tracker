import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { Mapping } from '../core/mapping';

interface MappingConfig {
  mappings: Array<{
    source: string;
    target: string;
  }>;
}

export const addCommand = new Command('add')
  .description('Add a new documentation mapping')
  .argument('<source>', 'Source code file and range (e.g., src/index.js:10-20)')
  .argument('<target>', 'Target documentation file and range (e.g., docs/api.md:5-15)')
  .action(async (source: string, target: string) => {
    try {
      const mapping = new Mapping(source, target);
      const validationErrors = mapping.validate();
      if (validationErrors.length > 0) {
        throw new Error(validationErrors[0]);
      }

      const configPath = path.join(process.cwd(), 'doc-tracker.json');
      let config: MappingConfig = { mappings: [] };

      if (await fs.pathExists(configPath)) {
        config = await fs.readJson(configPath);
      }

      config.mappings.push({ source, target });
      await fs.writeJson(configPath, config, { spaces: 2 });

      console.log(`✅ Added mapping: ${source} -> ${target}`);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }); 