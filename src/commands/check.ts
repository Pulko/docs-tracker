import { Command } from 'commander';
import { Mapping } from '../core/mapping';
import { ChangeDetector } from '../core/change-detector';

export const checkCommand = new Command('check')
  .description('Check if documentation is up to date with code changes')
  .argument('<source>', 'Source code file and range (e.g., src/index.js:10-20)')
  .argument('<target>', 'Target documentation file and range (e.g., docs/api.md:5-15)')
  .action(async (source: string, target: string) => {
    try {
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
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }); 