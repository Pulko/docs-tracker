import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { confirmCommand } from '../confirm';
import { Mapping } from '../../core/mapping';
import { ChangeDetector } from '../../core/change-detector';

jest.mock('fs-extra');
jest.mock('../../core/mapping');
jest.mock('../../core/change-detector');

const mockExit = jest.fn();
const mockCwd = jest.fn().mockReturnValue('/mock/project/root');
const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();

// Mock process and console
Object.defineProperty(process, 'exit', { value: mockExit });
Object.defineProperty(process, 'cwd', { value: mockCwd });
Object.defineProperty(console, 'log', { value: mockConsoleLog });
Object.defineProperty(console, 'error', { value: mockConsoleError });

describe('confirmCommand', () => {
  const mockProjectRoot = '/mock/project/root';
  const mockConfigPath = path.join(mockProjectRoot, '.doc-tracker');
  const mockRecords = [
    {
      source: { file: 'src/index.ts', startLine: 1, endLine: 10 },
      target: { file: 'docs/api.md', startLine: 1, endLine: 5 },
      sourceHash: 'old-source-hash',
      targetHash: 'old-target-hash'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockRecords));
    ((fs.writeFile as unknown) as jest.Mock).mockResolvedValue(undefined);
    (Mapping.fromFile as jest.Mock).mockResolvedValue(mockRecords);
    (Mapping.saveToFile as jest.Mock).mockResolvedValue(undefined);
  });

  describe('when confirming all mappings', () => {
    it('should update hashes for changed mappings', async () => {
      const mockMapping = {
        source: { file: 'src/index.ts', startLine: 1, endLine: 10 },
        target: { file: 'docs/api.md', startLine: 1, endLine: 5 },
        generateHashes: jest.fn().mockResolvedValue({
          sourceHash: 'new-source-hash',
          targetHash: 'new-target-hash'
        })
      };

      (Mapping as unknown as jest.Mock).mockImplementation(() => mockMapping);
      (ChangeDetector as unknown as jest.Mock).mockImplementation(() => ({
        detectChanges: jest.fn().mockResolvedValue(true)
      }));

      await confirmCommand.parseAsync(['node', 'confirm']);

      expect(Mapping.saveToFile).toHaveBeenCalledWith(
        mockConfigPath,
        [{
          ...mockRecords[0],
          sourceHash: 'new-source-hash',
          targetHash: 'new-target-hash'
        }]
      );
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ Updated 1 record in .doc-tracker');
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('should not update hashes if no changes detected', async () => {
      const mockMapping = {
        source: { file: 'src/index.ts', startLine: 1, endLine: 10 },
        target: { file: 'docs/api.md', startLine: 1, endLine: 5 },
        generateHashes: jest.fn()
      };

      (Mapping as unknown as jest.Mock).mockImplementation(() => mockMapping);
      (ChangeDetector as unknown as jest.Mock).mockImplementation(() => ({
        detectChanges: jest.fn().mockResolvedValue(false)
      }));

      await confirmCommand.parseAsync(['node', 'confirm']);

      expect(Mapping.saveToFile).not.toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith('ℹ️ No records needed updating');
      expect(mockExit).not.toHaveBeenCalled();
    });
  });

  describe('when confirming specific mapping', () => {
    it('should update hash for specified mapping if changes detected', async () => {
      const mockMapping = {
        source: { file: 'src/index.ts', startLine: 1, endLine: 10 },
        target: { file: 'docs/api.md', startLine: 1, endLine: 5 },
        validate: jest.fn().mockReturnValue([]),
        generateHashes: jest.fn().mockResolvedValue({
          sourceHash: 'new-source-hash',
          targetHash: 'new-target-hash'
        })
      };

      (Mapping as unknown as jest.Mock).mockImplementation(() => mockMapping);
      (ChangeDetector as unknown as jest.Mock).mockImplementation(() => ({
        detectChanges: jest.fn().mockResolvedValue(true)
      }));

      await confirmCommand.parseAsync(['node', 'confirm', 'src/index.ts:1-10', 'docs/api.md:1-5']);

      expect(Mapping.saveToFile).toHaveBeenCalledWith(
        mockConfigPath,
        [{
          ...mockRecords[0],
          sourceHash: 'new-source-hash',
          targetHash: 'new-target-hash'
        }]
      );
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ Updated record in .doc-tracker');
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('should throw error if mapping validation fails', async () => {
      const mockMapping = {
        validate: jest.fn().mockReturnValue(['Invalid mapping'])
      };

      (Mapping as unknown as jest.Mock).mockImplementation(() => mockMapping);

      await confirmCommand.parseAsync(['node', 'confirm', 'invalid', 'mapping']);

      expect(mockConsoleError).toHaveBeenCalledWith('Error:', 'Invalid mapping');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should throw error if mapping not found', async () => {
      const mockMapping = {
        source: { file: 'not-found.ts', startLine: 1, endLine: 10 },
        target: { file: 'not-found.md', startLine: 1, endLine: 5 },
        validate: jest.fn().mockReturnValue([])
      };

      (Mapping as unknown as jest.Mock).mockImplementation(() => mockMapping);
      (ChangeDetector as unknown as jest.Mock).mockImplementation(() => ({
        detectChanges: jest.fn().mockResolvedValue(true)
      }));

      await confirmCommand.parseAsync(['node', 'confirm', 'not-found.ts:1-10', 'not-found.md:1-5']);

      expect(mockConsoleError).toHaveBeenCalledWith('Error:', 'No matching record found in .doc-tracker');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should not update hash if no changes detected', async () => {
      const mockMapping = {
        source: { file: 'src/index.ts', startLine: 1, endLine: 10 },
        target: { file: 'docs/api.md', startLine: 1, endLine: 5 },
        validate: jest.fn().mockReturnValue([]),
        generateHashes: jest.fn()
      };

      (Mapping as unknown as jest.Mock).mockImplementation(() => mockMapping);
      (ChangeDetector as unknown as jest.Mock).mockImplementation(() => ({
        detectChanges: jest.fn().mockResolvedValue(false)
      }));

      await confirmCommand.parseAsync(['node', 'confirm', 'src/index.ts:1-10', 'docs/api.md:1-5']);

      expect(Mapping.saveToFile).not.toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith('ℹ️ No changes detected, nothing to update');
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('should handle unexpected errors', async () => {
      const error = new Error('Unexpected error');
      (Mapping.fromFile as jest.Mock).mockRejectedValue(error);

      await confirmCommand.parseAsync(['node', 'confirm']);

      expect(mockConsoleError).toHaveBeenCalledWith('Error:', 'Unexpected error');
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });
}); 