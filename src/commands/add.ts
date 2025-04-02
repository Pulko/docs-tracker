import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { Mapping } from '../core/mapping';

export const addCommand = new Command('add')
  .description('Add a new documentation mapping')
  .argument('<source>', 'Source code file and range (e.g., src/index.js:10-20)')
  .argument('<target>', 'Target documentation file and range (e.g., docs/api.md:5-15)')
  .action(async (source: string, target: string) => {
    try {
      // Validate the mapping first
      const mapping = new Mapping(source, target);
      const validationErrors = mapping.validate();
      if (validationErrors.length > 0) {
        throw new Error(validationErrors[0]);
      }

      // Generate hashes for the mapping
      const { sourceHash, targetHash } = await mapping.generateHashes();
      const mappingWithHashes = new Mapping(source, target, sourceHash, targetHash);

      const configPath = path.join(process.cwd(), '.doc-tracker');
      let mappings: Mapping[] = [];

      if (await fs.pathExists(configPath)) {
        const records = await Mapping.fromFile(configPath);
        mappings = records.map(record => {
          const sourceStr = `${record.source.file}:${record.source.isCharacterRange ? 
            `${record.source.line}@${record.source.startChar}-${record.source.endChar}` : 
            `${record.source.startLine}-${record.source.endLine}`}`;
          const targetStr = `${record.target.file}:${record.target.isCharacterRange ? 
            `${record.target.line}@${record.target.startChar}-${record.target.endChar}` : 
            `${record.target.startLine}-${record.target.endLine}`}`;
          
          const newMapping = new Mapping(sourceStr, targetStr, record.sourceHash, record.targetHash);
          const errors = newMapping.validate(['file-existence']);
          if (errors.length > 0) {
            throw new Error(`Invalid mapping in config file: ${errors.join(', ')}`);
          }
          return newMapping;
        });
      }

      mappings.push(mappingWithHashes);
      await Mapping.saveToFile(configPath, mappings);

      console.log(`✅ Added mapping: ${source} -> ${target}`);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }); 