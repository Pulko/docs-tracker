import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { listCommand } from '../list';

// Mock fs-extra
jest.mock('fs-extra');

describe('listCommand', () => {
  let mockExit: jest.SpyInstance;
  let mockLog: jest.SpyInstance;
  let mockError: jest.SpyInstance;
  const mockConfigPath = path.join(process.cwd(), 'doc-tracker.json');

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock process.cwd
    jest.spyOn(process, 'cwd').mockReturnValue('/mock/project/root');

    // Mock process.exit
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit() called');
    });

    // Mock console methods
    mockLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockError = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock fs methods
    (fs.pathExists as jest.Mock).mockResolvedValue(true);
    (fs.readJson as jest.Mock).mockResolvedValue({
      mappings: [
        { source: 'src/index.ts:1-1', target: 'docs/api.md:1-1' }
      ]
    });
  });

  afterEach(() => {
    mockExit.mockRestore();
    mockLog.mockRestore();
    mockError.mockRestore();
  });

  it('should display mappings when config file exists', async () => {
    await listCommand.parseAsync(['node', 'list']);

    expect(mockLog).toHaveBeenCalledWith('Documentation Mappings:');
    expect(mockLog).toHaveBeenCalledWith('1. src/index.ts:1-1 -> docs/api.md:1-1');
  });

  it('should handle empty config file', async () => {
    (fs.readJson as jest.Mock).mockResolvedValue({ mappings: [] });

    await listCommand.parseAsync(['node', 'list']);

    expect(mockLog).toHaveBeenCalledWith('No documentation mappings found.');
  });

  it('should handle missing config file', async () => {
    (fs.pathExists as jest.Mock).mockResolvedValue(false);

    await listCommand.parseAsync(['node', 'list']);

    expect(mockLog).toHaveBeenCalledWith('No documentation mappings found.');
  });

  it('should handle file system errors', async () => {
    (fs.readJson as jest.Mock).mockRejectedValue(new Error('File system error'));

    await expect(listCommand.parseAsync(['node', 'list'])).rejects.toThrow('process.exit() called');
    expect(mockError).toHaveBeenCalledWith('Error:', 'File system error');
  });

  it('should handle unexpected errors', async () => {
    (fs.readJson as jest.Mock).mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    await expect(listCommand.parseAsync(['node', 'list'])).rejects.toThrow('process.exit() called');
    expect(mockError).toHaveBeenCalledWith('Error:', 'Unexpected error');
  });
}); 