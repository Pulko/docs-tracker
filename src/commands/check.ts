import { Command } from 'commander';
import { Mapping } from '../core/mapping';
import { ChangeDetector } from '../core/change-detector';
import path from 'path';

export const checkCommand = new Command('check')
  .description('Check if documentation is up to date with code changes')
  .argument('[source]', 'Source code file and range (e.g., src/index.js:10-20)')
  .argument('[target]', 'Target documentation file and range (e.g., docs/api.md:5-15)')
  .action(async (source?: string, target?: string) => {
    try {
      const configPath = path.join(process.cwd(), '.doc-tracker');
      
      if (!source || !target) {
        // Check all mappings
        const records = await Mapping.fromFile(configPath);
        let hasOutdatedDocs = false;

        for (const record of records) {
          const sourceStr = `${record.source.file}:${record.source.isCharacterRange ? 
            `${record.source.line}@${record.source.startChar}-${record.source.endChar}` : 
            `${record.source.startLine}-${record.source.endLine}`}`;
          const targetStr = `${record.target.file}:${record.target.isCharacterRange ? 
            `${record.target.line}@${record.target.startChar}-${record.target.endChar}` : 
            `${record.target.startLine}-${record.target.endLine}`}`;
          
          const mapping = new Mapping(sourceStr, targetStr, record.sourceHash, record.targetHash);
          const detector = new ChangeDetector(mapping);
          const hasChanges = await detector.detectChanges();
          
          if (hasChanges) {
            console.error(`❌ Documentation is out of date for: ${record.source.file} -> ${record.target.file}`);
            hasOutdatedDocs = true;
          }
        }

        if (hasOutdatedDocs) {
          process.exit(1);
        } else {
          console.log('✅ All documentation is up to date');
        }
      } else {
        // Check single mapping
        const mapping = new Mapping(source, target);
        const validationErrors = mapping.validate();
        if (validationErrors.length > 0) {
          throw new Error(validationErrors[0]);
        }

        const detector = new ChangeDetector(mapping);
        const hasChanges = await detector.detectChanges();

        if (hasChanges) {
          console.error('❌ Documentation is out of date with code changes');
          process.exit(1);
        } else {
          console.log('✅ Documentation is up to date');
        }
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }); 