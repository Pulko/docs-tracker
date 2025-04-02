import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { removeCommand } from '../remove';
import { Mapping } from '../../core/mapping';

jest.mock('fs-extra');
jest.mock('../../core/mapping');

describe('removeCommand', () => {
  const mockProjectRoot = '/mock/project/root';
  const mockConfigPath = path.join(mockProjectRoot, '.doc-tracker');
  const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
  const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
  const mockExit = jest.spyOn(process, 'exit').mockImplementation();
  const mockCwd = jest.spyOn(process, 'cwd').mockReturnValue(mockProjectRoot);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should remove a mapping successfully', async () => {
    const mockMapping = {
      source: { file: 'src/index.ts', startLine: 1, endLine: 10, isCharacterRange: false },
      target: { file: 'docs/api.md', startLine: 1, endLine: 10, isCharacterRange: false },
      sourceHash: 'abc123',
      targetHash: 'def456'
    };

    (fs.pathExists as jest.Mock).mockResolvedValue(true);
    (Mapping.fromFile as jest.Mock).mockResolvedValue([mockMapping]);
    (Mapping.saveToFile as jest.Mock).mockResolvedValue(undefined);

    await removeCommand.parseAsync(['node', 'remove', '1']);

    expect(fs.pathExists).toHaveBeenCalledWith(mockConfigPath);
    expect(Mapping.fromFile).toHaveBeenCalledWith(mockConfigPath);
    expect(Mapping.saveToFile).toHaveBeenCalledWith(mockConfigPath, []);
    expect(mockConsoleLog).toHaveBeenCalledWith('✅ Removed mapping: src/index.ts -> docs/api.md');
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should handle non-existent config file', async () => {
    (fs.pathExists as jest.Mock).mockResolvedValue(false);

    await removeCommand.parseAsync(['node', 'remove', '1']);

    expect(fs.pathExists).toHaveBeenCalledWith(mockConfigPath);
    expect(mockConsoleError).toHaveBeenCalledWith('Error:', 'No mappings found');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle empty config file', async () => {
    (fs.pathExists as jest.Mock).mockResolvedValue(true);
    (Mapping.fromFile as jest.Mock).mockResolvedValue([]);

    await removeCommand.parseAsync(['node', 'remove', '1']);

    expect(fs.pathExists).toHaveBeenCalledWith(mockConfigPath);
    expect(Mapping.fromFile).toHaveBeenCalledWith(mockConfigPath);
    expect(mockConsoleError).toHaveBeenCalledWith('Error:', 'Invalid index. Please provide a number between 1 and 0');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle out of range index', async () => {
    const mockMapping = {
      source: { file: 'src/index.ts', startLine: 1, endLine: 10, isCharacterRange: false },
      target: { file: 'docs/api.md', startLine: 1, endLine: 10, isCharacterRange: false },
      sourceHash: 'abc123',
      targetHash: 'def456'
    };

    (fs.pathExists as jest.Mock).mockResolvedValue(true);
    (Mapping.fromFile as jest.Mock).mockResolvedValue([mockMapping]);

    await removeCommand.parseAsync(['node', 'remove', '2']);

    expect(fs.pathExists).toHaveBeenCalledWith(mockConfigPath);
    expect(Mapping.fromFile).toHaveBeenCalledWith(mockConfigPath);
    expect(mockConsoleError).toHaveBeenCalledWith('Error:', 'Invalid index. Please provide a number between 1 and 1');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle invalid index format', async () => {
    await removeCommand.parseAsync(['node', 'remove', 'invalid']);

    expect(mockConsoleError).toHaveBeenCalledWith('Error:', 'Invalid index. Please provide a valid number.');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle file system errors', async () => {
    (fs.pathExists as jest.Mock).mockRejectedValue(new Error('File system error'));

    await removeCommand.parseAsync(['node', 'remove', '1']);

    expect(mockConsoleError).toHaveBeenCalledWith('Error:', 'File system error');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle unexpected errors', async () => {
    (fs.pathExists as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

    await removeCommand.parseAsync(['node', 'remove', '1']);

    expect(mockConsoleError).toHaveBeenCalledWith('Error:', 'Unexpected error');
    expect(mockExit).toHaveBeenCalledWith(1);
  });
}); 