import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { checkCommand } from '../check';
import { Mapping } from '../../core/mapping';
import { ChangeDetector } from '../../core/change-detector';

jest.mock('fs-extra', () => ({
  pathExists: jest.fn(),
  readJson: jest.fn(),
  writeJson: jest.fn()
}));
jest.mock('../../core/mapping');
jest.mock('../../core/change-detector');

describe('checkCommand', () => {
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
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should check mappings and report no changes', async () => {
    const mockMapping = {
      source: { file: 'src/index.ts', startLine: 1, endLine: 10, isCharacterRange: false },
      target: { file: 'docs/api.md', startLine: 1, endLine: 10, isCharacterRange: false },
      sourceHash: 'abc123',
      targetHash: 'def456',
      validate: jest.fn().mockReturnValue([])
    };

    (Mapping.fromFile as jest.Mock).mockResolvedValue([mockMapping]);
    ((Mapping as unknown) as jest.Mock).mockImplementation(() => mockMapping);
    ((ChangeDetector as unknown) as jest.Mock).mockImplementation(() => ({
      detectChanges: jest.fn().mockResolvedValue(false)
    }));

    await checkCommand.parseAsync(['node', 'check']);

    expect(Mapping.fromFile).toHaveBeenCalledWith(mockConfigPath);
    expect(mockConsoleLog).toHaveBeenCalledWith('✅ All documentation is up to date');
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should detect and report changes', async () => {
    const mockMapping = {
      source: { file: 'src/index.ts', startLine: 1, endLine: 10, isCharacterRange: false },
      target: { file: 'docs/api.md', startLine: 1, endLine: 10, isCharacterRange: false },
      sourceHash: 'abc123',
      targetHash: 'def456',
      validate: jest.fn().mockReturnValue([])
    };

    (Mapping.fromFile as jest.Mock).mockResolvedValue([mockMapping]);
    ((Mapping as unknown) as jest.Mock).mockImplementation(() => mockMapping);
    ((ChangeDetector as unknown) as jest.Mock).mockImplementation(() => ({
      detectChanges: jest.fn().mockResolvedValue(true)
    }));

    await checkCommand.parseAsync(['node', 'check']);

    expect(Mapping.fromFile).toHaveBeenCalledWith(mockConfigPath);
    expect(mockConsoleError).toHaveBeenCalledWith('❌ Documentation is out of date for: src/index.ts -> docs/api.md');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle empty config file', async () => {
    (Mapping.fromFile as jest.Mock).mockResolvedValue([]);

    await checkCommand.parseAsync(['node', 'check']);

    expect(Mapping.fromFile).toHaveBeenCalledWith(mockConfigPath);
    expect(mockConsoleLog).toHaveBeenCalledWith('✅ All documentation is up to date');
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should handle non-existent config file', async () => {
    (Mapping.fromFile as jest.Mock).mockRejectedValue(new Error('Configuration file not found'));

    await checkCommand.parseAsync(['node', 'check']);

    expect(Mapping.fromFile).toHaveBeenCalledWith(mockConfigPath);
    expect(mockConsoleError).toHaveBeenCalledWith('Error:', 'Configuration file not found');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle file system errors', async () => {
    (Mapping.fromFile as jest.Mock).mockRejectedValue(new Error('File system error'));

    await checkCommand.parseAsync(['node', 'check']);

    expect(Mapping.fromFile).toHaveBeenCalledWith(mockConfigPath);
    expect(mockConsoleError).toHaveBeenCalledWith('Error:', 'File system error');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle unexpected errors', async () => {
    (Mapping.fromFile as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

    await checkCommand.parseAsync(['node', 'check']);

    expect(Mapping.fromFile).toHaveBeenCalledWith(mockConfigPath);
    expect(mockConsoleError).toHaveBeenCalledWith('Error:', 'Unexpected error');
    expect(mockExit).toHaveBeenCalledWith(1);
  });
}); 