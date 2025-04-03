import { Command } from 'commander';
import { Mapping } from '../core/mapping';
import { ChangeDetector } from '../core/change-detector';
import path from 'path';

export const confirmCommand = new Command('confirm')
  .alias('-cf')
  .description('Confirm that documentation has been updated and update the hash in .doc-tracker')
  .argument('[source]', 'Source code file and range (e.g., src/index.js:10-20)')
  .argument('[target]', 'Target documentation file and range (e.g., docs/api.md:5-15)')
  .action(async (source?: string, target?: string) => {
    try {
      const configPath = path.join(process.cwd(), '.doc-tracker');
      
      if (!source || !target) {
        // Confirm all mappings
        const records = await Mapping.fromFile(configPath);
        let updatedCount = 0;

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
            // Update the hash in the record using existing generateHashes method
            const { sourceHash, targetHash } = await mapping.generateHashes();
            record.sourceHash = sourceHash;
            record.targetHash = targetHash;
            updatedCount++;
          }
        }

        if (updatedCount > 0) {
          await Mapping.saveToFile(configPath, records);
          console.log(`✅ Updated ${updatedCount} record${updatedCount === 1 ? '' : 's'} in .doc-tracker`);
        } else {
          console.log('ℹ️ No records needed updating');
        }
      } else {
        // Confirm single mapping
        const records = await Mapping.fromFile(configPath);
        const mapping = new Mapping(source, target);
        const validationErrors = mapping.validate();
        if (validationErrors.length > 0) {
          throw new Error(validationErrors[0]);
        }

        const detector = new ChangeDetector(mapping);
        const hasChanges = await detector.detectChanges();

        if (hasChanges) {
          // Find and update the matching record
          const record = records.find(r => 
            r.source.file === mapping.source.file &&
            r.source.startLine === mapping.source.startLine &&
            r.source.endLine === mapping.source.endLine &&
            r.target.file === mapping.target.file &&
            r.target.startLine === mapping.target.startLine &&
            r.target.endLine === mapping.target.endLine
          );

          if (record) {
            // Update the hash in the record using existing generateHashes method
            const { sourceHash, targetHash } = await mapping.generateHashes();
            record.sourceHash = sourceHash;
            record.targetHash = targetHash;
            await Mapping.saveToFile(configPath, records);
            console.log('✅ Updated record in .doc-tracker');
          } else {
            throw new Error('No matching record found in .doc-tracker');
          }
        } else {
          console.log('ℹ️ No changes detected, nothing to update');
        }
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }); 