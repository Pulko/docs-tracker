import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { checkCommand } from '../check';
import { Mapping } from '../../core/mapping';
import { ChangeDetector } from '../../core/change-detector';

jest.mock('fs-extra');
jest.mock('../../core/mapping');
jest.mock('../../core/change-detector');

describe('checkCommand', () => {
  let mockExit: jest.SpyInstance;
  let mockLog: jest.SpyInstance;
  let mockError: jest.SpyInstance;
  let mockMapping: jest.Mocked<Mapping>;
  let mockChangeDetector: jest.Mocked<ChangeDetector>;
  const mockConfigPath = path.join('/mock/project/root', 'doc-tracker.json');
  const mockMappings = [
    { source: 'src/index.ts:1-1', target: 'docs/api.md:1-1' },
    { source: 'src/utils.ts:5-10', target: 'docs/utils.md:2-7' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock process.exit
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit() called');
    });

    // Mock console methods
    mockLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockError = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock fs methods
    (fs.pathExists as jest.Mock).mockResolvedValue(true);
    (fs.readJson as jest.Mock).mockResolvedValue({ mappings: mockMappings });

    // Mock Mapping class
    mockMapping = new Mapping('src/index.ts:1-1', 'docs/api.md:1-1') as jest.Mocked<Mapping>;
    (Mapping as jest.Mock).mockImplementation(() => mockMapping);
    mockMapping.validate.mockReturnValue([]);

    // Mock ChangeDetector class
    mockChangeDetector = new ChangeDetector(mockMapping) as jest.Mocked<ChangeDetector>;
    (ChangeDetector as jest.Mock).mockImplementation(() => mockChangeDetector);
    mockChangeDetector.detectChanges.mockResolvedValue(false);
  });

  afterEach(() => {
    mockExit.mockRestore();
    mockLog.mockRestore();
    mockError.mockRestore();
  });

  it('should check documentation status', async () => {
    await checkCommand.parseAsync(['node', 'check', 'src/index.ts:1-1', 'docs/api.md:1-1']);
    expect(mockLog).toHaveBeenCalledWith('✅ Documentation is up to date');
  });

  it('should handle validation errors', async () => {
    mockMapping.validate.mockReturnValue(['Validation error']);
    await expect(checkCommand.parseAsync(['node', 'check', 'src/index.ts:1-1', 'docs/api.md:1-1'])).rejects.toThrow('process.exit() called');
    expect(mockError).toHaveBeenCalledWith('Error:', 'Validation error');
  });

  it('should handle file system errors', async () => {
    mockChangeDetector.detectChanges.mockRejectedValue(new Error('File system error'));
    await expect(checkCommand.parseAsync(['node', 'check', 'src/index.ts:1-1', 'docs/api.md:1-1'])).rejects.toThrow('process.exit() called');
    expect(mockError).toHaveBeenCalledWith('Error:', 'File system error');
  });

  it('should handle unexpected errors', async () => {
    mockChangeDetector.detectChanges.mockRejectedValue(new Error('Unexpected error'));
    await expect(checkCommand.parseAsync(['node', 'check', 'src/index.ts:1-1', 'docs/api.md:1-1'])).rejects.toThrow('process.exit() called');
    expect(mockError).toHaveBeenCalledWith('Error:', 'Unexpected error');
  });

  it('should handle out of date documentation', async () => {
    mockChangeDetector.detectChanges.mockResolvedValue(true);
    await expect(checkCommand.parseAsync(['node', 'check', 'src/index.ts:1-1', 'docs/api.md:1-1'])).rejects.toThrow('process.exit() called');
    expect(mockError).toHaveBeenCalledWith('❌ Documentation is out of date with code changes');
  });
}); 