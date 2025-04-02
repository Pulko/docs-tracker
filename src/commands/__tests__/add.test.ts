import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { addCommand } from '../add';
import { Mapping } from '../../core/mapping';

jest.mock('fs-extra', () => ({
  pathExists: jest.fn(),
  readJson: jest.fn(),
  writeJson: jest.fn()
}));
jest.mock('../../core/mapping');

describe('addCommand', () => {
  const mockProjectRoot = '/mock/project/root';
  const mockConfigPath = path.join(mockProjectRoot, '.doc-tracker');
  const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
  const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
  const mockExit = jest.spyOn(process, 'exit').mockImplementation();

  beforeAll(() => {
    jest.spyOn(process, 'cwd').mockReturnValue(mockProjectRoot);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (fs.pathExists as jest.Mock).mockResolvedValue(true);
    (Mapping.fromFile as jest.Mock).mockResolvedValue([]);
    (Mapping.saveToFile as jest.Mock).mockResolvedValue(undefined);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should add a new mapping successfully', async () => {
    const mockMapping = {
      source: { file: 'src/index.ts', startLine: 1, endLine: 10, isCharacterRange: false },
      target: { file: 'docs/api.md', startLine: 1, endLine: 10, isCharacterRange: false },
      sourceHash: 'abc123',
      targetHash: 'def456',
      validate: jest.fn().mockReturnValue([]),
      generateHashes: jest.fn().mockResolvedValue({ sourceHash: 'abc123', targetHash: 'def456' })
    };

    ((Mapping as unknown) as jest.Mock).mockImplementation(() => mockMapping);

    await addCommand.parseAsync(['node', 'add', 'src/index.ts:1-10', 'docs/api.md:1-10']);

    expect(fs.pathExists).toHaveBeenCalledWith(mockConfigPath);
    expect(Mapping.fromFile).toHaveBeenCalledWith(mockConfigPath);
    expect(Mapping.saveToFile).toHaveBeenCalledWith(mockConfigPath, [mockMapping]);
    expect(mockConsoleLog).toHaveBeenCalledWith('✅ Added mapping: src/index.ts:1-10 -> docs/api.md:1-10');
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should create config file if it does not exist', async () => {
    const mockMapping = {
      source: { file: 'src/index.ts', startLine: 1, endLine: 10, isCharacterRange: false },
      target: { file: 'docs/api.md', startLine: 1, endLine: 10, isCharacterRange: false },
      sourceHash: 'abc123',
      targetHash: 'def456',
      validate: jest.fn().mockReturnValue([]),
      generateHashes: jest.fn().mockResolvedValue({ sourceHash: 'abc123', targetHash: 'def456' })
    };

    (fs.pathExists as jest.Mock).mockResolvedValue(false);
    ((Mapping as unknown) as jest.Mock).mockImplementation(() => mockMapping);

    await addCommand.parseAsync(['node', 'add', 'src/index.ts:1-10', 'docs/api.md:1-10']);

    expect(fs.pathExists).toHaveBeenCalledWith(mockConfigPath);
    expect(Mapping.saveToFile).toHaveBeenCalledWith(mockConfigPath, [mockMapping]);
    expect(mockConsoleLog).toHaveBeenCalledWith('✅ Added mapping: src/index.ts:1-10 -> docs/api.md:1-10');
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should handle invalid source file format', async () => {
    const mockMapping = {
      validate: jest.fn().mockReturnValue(['Invalid source file format. Expected format: file:start-end'])
    };

    ((Mapping as unknown) as jest.Mock).mockImplementation(() => mockMapping);

    await addCommand.parseAsync(['node', 'add', 'invalid-format', 'docs/api.md:1-10']);

    expect(mockConsoleError).toHaveBeenCalledWith('Error:', 'Invalid source file format. Expected format: file:start-end');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle invalid target file format', async () => {
    const mockMapping = {
      validate: jest.fn().mockReturnValue(['Invalid target file format. Expected format: file:start-end'])
    };

    ((Mapping as unknown) as jest.Mock).mockImplementation(() => mockMapping);

    await addCommand.parseAsync(['node', 'add', 'src/index.ts:1-10', 'invalid-format']);

    expect(mockConsoleError).toHaveBeenCalledWith('Error:', 'Invalid target file format. Expected format: file:start-end');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle file system errors', async () => {
    const mockMapping = {
      validate: jest.fn().mockReturnValue([]),
      generateHashes: jest.fn().mockResolvedValue({ sourceHash: 'abc123', targetHash: 'def456' })
    };

    ((Mapping as unknown) as jest.Mock).mockImplementation(() => mockMapping);
    (fs.pathExists as jest.Mock).mockRejectedValue(new Error('File system error'));

    await addCommand.parseAsync(['node', 'add', 'src/index.ts:1-10', 'docs/api.md:1-10']);

    expect(mockConsoleError).toHaveBeenCalledWith('Error:', 'File system error');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle unexpected errors', async () => {
    const mockMapping = {
      validate: jest.fn().mockReturnValue([]),
      generateHashes: jest.fn().mockRejectedValue(new Error('Unexpected error'))
    };

    ((Mapping as unknown) as jest.Mock).mockImplementation(() => mockMapping);

    await addCommand.parseAsync(['node', 'add', 'src/index.ts:1-10', 'docs/api.md:1-10']);

    expect(mockConsoleError).toHaveBeenCalledWith('Error:', 'Unexpected error');
    expect(mockExit).toHaveBeenCalledWith(1);
  });
}); 