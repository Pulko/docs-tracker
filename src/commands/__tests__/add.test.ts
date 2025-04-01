import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { addCommand } from '../add';
import { Mapping } from '../../core/mapping';

jest.mock('fs-extra');
jest.mock('../../core/mapping');

describe('addCommand', () => {
  let mockExit: jest.SpyInstance;
  let mockLog: jest.SpyInstance;
  let mockError: jest.SpyInstance;
  let mockCwd: jest.SpyInstance;
  let mockMapping: jest.Mocked<Mapping>;
  const mockProjectRoot = '/mock/project/root';
  const mockConfigPath = path.join(mockProjectRoot, 'doc-tracker.json');
  const mockMappings = [
    { source: 'src/index.ts:1-1', target: 'docs/api.md:1-1' }
  ];

  beforeEach(() => {
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

    // Mock Mapping class
    mockMapping = new Mapping('src/file.ts:1-10', 'docs/file.md:1-10') as jest.Mocked<Mapping>;
    (Mapping as jest.Mock).mockImplementation(() => mockMapping);
    mockMapping.validate.mockReturnValue([]);
  });

  afterEach(() => {
    mockExit.mockRestore();
    mockLog.mockRestore();
    mockError.mockRestore();
    mockCwd.mockRestore();
  });

  it('should add a new mapping', async () => {
    const source = 'src/file.ts:1-10';
    const target = 'docs/file.md:1-10';
    await addCommand.parseAsync(['node', 'add', source, target]);

    expect(fs.writeJson).toHaveBeenCalledWith(
      mockConfigPath,
      {
        mappings: [...mockMappings, { source, target }]
      },
      { spaces: 2 }
    );
    expect(mockLog).toHaveBeenCalledWith(`✅ Added mapping: ${source} -> ${target}`);
  });

  it('should handle validation errors', async () => {
    mockMapping.validate.mockReturnValue(['Validation error']);
    await expect(addCommand.parseAsync(['node', 'add', 'src/file.ts:1-10', 'docs/file.md:1-10'])).rejects.toThrow('process.exit() called');
    expect(mockError).toHaveBeenCalledWith('Error:', 'Validation error');
  });

  it('should handle file system errors', async () => {
    (fs.writeJson as jest.Mock).mockRejectedValue(new Error('File system error'));
    await expect(addCommand.parseAsync(['node', 'add', 'src/file.ts:1-10', 'docs/file.md:1-10'])).rejects.toThrow('process.exit() called');
    expect(mockError).toHaveBeenCalledWith('Error:', 'File system error');
  });

  it('should handle unexpected errors', async () => {
    mockMapping.validate.mockReturnValue(['Unexpected error']);
    await expect(addCommand.parseAsync(['node', 'add', 'src/file.ts:1-10', 'docs/file.md:1-10'])).rejects.toThrow('process.exit() called');
    expect(mockError).toHaveBeenCalledWith('Error:', 'Unexpected error');
  });
}); 