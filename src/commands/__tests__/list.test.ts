import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { listCommand } from '../list';
import { Mapping } from '../../core/mapping';

jest.mock('fs-extra');
jest.mock('../../core/mapping');

const mockExit = jest.fn();
const mockCwd = jest.fn().mockReturnValue('/mock/project/root');
const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();

// Mock process and console
Object.defineProperty(process, 'exit', { value: mockExit });
Object.defineProperty(process, 'cwd', { value: mockCwd });
Object.defineProperty(console, 'log', { value: mockConsoleLog });
Object.defineProperty(console, 'error', { value: mockConsoleError });

describe('listCommand', () => {
  const mockProjectRoot = '/mock/project/root';
  const mockConfigPath = path.join(mockProjectRoot, '.doc-tracker');
  const mockRecords = [
    {
      source: { file: 'src/index.ts', isCharacterRange: false, startLine: 1, endLine: 10 },
      target: { file: 'docs/api.md', isCharacterRange: false, startLine: 1, endLine: 10 },
      sourceHash: 'abc123',
      targetHash: 'def456',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (Mapping.fromFile as jest.Mock).mockResolvedValue(mockRecords);
  });

  it('should list all mappings when config exists', async () => {
    (fs.pathExists as jest.Mock).mockResolvedValue(true);
    (fs.readJson as jest.Mock).mockResolvedValue(mockRecords);

    await listCommand.parseAsync(['node', 'list']);

    expect(fs.pathExists).toHaveBeenCalledWith(mockConfigPath);
    expect(Mapping.fromFile).toHaveBeenCalledWith(mockConfigPath);
    expect(mockConsoleLog).toHaveBeenCalledWith('Documentation Mappings:');
    expect(mockConsoleLog).toHaveBeenCalledWith('=====================');
    expect(mockConsoleLog).toHaveBeenCalledWith('1. src/index.ts:1-10 -> docs/api.md:1-10');
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should handle empty config file', async () => {
    (fs.pathExists as jest.Mock).mockResolvedValue(true);
    (fs.readJson as jest.Mock).mockResolvedValue([]);
    (Mapping.fromFile as jest.Mock).mockResolvedValue([]);

    await listCommand.parseAsync(['node', 'list']);

    expect(fs.pathExists).toHaveBeenCalledWith(mockConfigPath);
    expect(Mapping.fromFile).toHaveBeenCalledWith(mockConfigPath);
    expect(mockConsoleLog).toHaveBeenCalledWith('No documentation mappings found.');
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should handle non-existent config file', async () => {
    (fs.pathExists as jest.Mock).mockResolvedValue(false);

    await listCommand.parseAsync(['node', 'list']);

    expect(fs.pathExists).toHaveBeenCalledWith(mockConfigPath);
    expect(mockConsoleLog).toHaveBeenCalledWith('No documentation mappings found.');
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should handle file system errors', async () => {
    const error = new Error('File system error');
    (fs.pathExists as jest.Mock).mockRejectedValue(error);
    (Mapping.fromFile as jest.Mock).mockRejectedValue(error);

    await listCommand.parseAsync(['node', 'list']);

    expect(mockConsoleError).toHaveBeenCalledWith('Error:', 'File system error');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle unexpected errors', async () => {
    const error = new Error('Unexpected error');
    (fs.pathExists as jest.Mock).mockRejectedValue(error);
    (Mapping.fromFile as jest.Mock).mockRejectedValue(error);

    await listCommand.parseAsync(['node', 'list']);

    expect(mockConsoleError).toHaveBeenCalledWith('Error:', 'Unexpected error');
    expect(mockExit).toHaveBeenCalledWith(1);
  });
}); 