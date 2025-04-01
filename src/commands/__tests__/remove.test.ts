import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { removeCommand } from '../remove';

// Mock fs-extra
jest.mock('fs-extra');

describe('removeCommand', () => {
  let mockExit: jest.SpyInstance;
  let mockLog: jest.SpyInstance;
  let mockError: jest.SpyInstance;
  let mockCwd: jest.SpyInstance;
  const mockProjectRoot = '/mock/project/root';
  const mockConfigPath = path.join(mockProjectRoot, 'doc-tracker.json');
  const mockMappings = [
    { source: 'src/index.ts:1-1', target: 'docs/api.md:1-1' }
  ];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock process.exit and process.cwd
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit() called');
    });
    mockCwd = jest.spyOn(process, 'cwd').mockReturnValue(mockProjectRoot);

    // Mock console methods
    mockLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockError = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock fs methods
    (fs.pathExists as jest.Mock).mockResolvedValue(true);
    (fs.readJson as jest.Mock).mockResolvedValue({ mappings: [...mockMappings] });
    (fs.writeJson as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    mockExit.mockRestore();
    mockLog.mockRestore();
    mockError.mockRestore();
    mockCwd.mockRestore();
  });

  it('should remove a mapping', async () => {
    const mapping = mockMappings[0];
    await removeCommand.parseAsync(['node', 'remove', '1']);

    expect(fs.writeJson).toHaveBeenCalledWith(
      mockConfigPath,
      { mappings: [] },
      { spaces: 2 }
    );
    expect(mockLog).toHaveBeenCalledWith(`✅ Removed mapping: ${mapping.source} -> ${mapping.target}`);
  });

  it('should handle invalid index', async () => {
    await expect(removeCommand.parseAsync(['node', 'remove', '999'])).rejects.toThrow('process.exit() called');
    expect(mockError).toHaveBeenCalledWith('Error:', 'Invalid index. Please provide a number between 1 and 1');
  });

  it('should handle non-numeric index', async () => {
    await expect(removeCommand.parseAsync(['node', 'remove', 'abc'])).rejects.toThrow('process.exit() called');
    expect(mockError).toHaveBeenCalledWith('Error:', 'Invalid index. Please provide a valid number.');
  });

  it('should handle missing config file', async () => {
    (fs.pathExists as jest.Mock).mockResolvedValue(false);
    await expect(removeCommand.parseAsync(['node', 'remove', '1'])).rejects.toThrow('process.exit() called');
    expect(mockError).toHaveBeenCalledWith('Error:', 'No mappings found');
  });

  it('should handle file system errors', async () => {
    (fs.readJson as jest.Mock).mockRejectedValue(new Error('File system error'));
    await expect(removeCommand.parseAsync(['node', 'remove', '1'])).rejects.toThrow('process.exit() called');
    expect(mockError).toHaveBeenCalledWith('Error:', 'File system error');
  });

  it('should handle unexpected errors', async () => {
    await expect(removeCommand.parseAsync(['node', 'remove', '0'])).rejects.toThrow('process.exit() called');
    expect(mockError).toHaveBeenCalledWith('Error:', 'Invalid index. Please provide a number between 1 and 1');
  });
}); 