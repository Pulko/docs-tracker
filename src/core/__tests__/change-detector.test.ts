import fs from 'fs-extra';
import path from 'path';
import { Mapping } from '../mapping';
import { ChangeDetector } from '../change-detector';

jest.mock('fs-extra');
jest.mock('../mapping');

describe('ChangeDetector', () => {
  let mockMapping: jest.Mocked<Mapping>;
  let mockChangeDetector: ChangeDetector;
  const mockProjectRoot = '/mock/project/root';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Mapping class
    mockMapping = new Mapping('', '') as jest.Mocked<Mapping>;
    (Mapping as jest.Mock).mockImplementation(() => mockMapping);
    mockMapping.getSource.mockReturnValue({ file: 'src/file.ts', line: 1, startChar: 1, endChar: 10, isCharacterRange: true });
    mockMapping.getTarget.mockReturnValue({ file: 'docs/file.md', line: 1, startChar: 1, endChar: 10, isCharacterRange: true });
    mockMapping.getProjectRoot.mockReturnValue(mockProjectRoot);

    // Mock fs methods
    (fs.readFile as unknown as jest.Mock).mockResolvedValue('test content');

    mockChangeDetector = new ChangeDetector(mockMapping);
  });

  it('should detect no changes when content is identical', async () => {
    const changes = await mockChangeDetector.detectChanges();
    expect(changes).toBe(false);
  });

  it('should detect changes when content differs', async () => {
    (fs.readFile as unknown as jest.Mock)
      .mockResolvedValueOnce('source content')
      .mockResolvedValueOnce('target content');

    const changes = await mockChangeDetector.detectChanges();
    expect(changes).toBe(true);
  });

  it('should handle line ranges correctly', async () => {
    mockMapping.getSource.mockReturnValue({ file: 'src/file.ts', startLine: 1, endLine: 10, isCharacterRange: false });
    mockMapping.getTarget.mockReturnValue({ file: 'docs/file.md', startLine: 1, endLine: 10, isCharacterRange: false });

    const changes = await mockChangeDetector.detectChanges();
    expect(changes).toBe(false);
  });

  it('should handle character ranges correctly', async () => {
    mockMapping.getSource.mockReturnValue({ file: 'src/file.ts', line: 1, startChar: 1, endChar: 10, isCharacterRange: true });
    mockMapping.getTarget.mockReturnValue({ file: 'docs/file.md', line: 1, startChar: 1, endChar: 10, isCharacterRange: true });

    const changes = await mockChangeDetector.detectChanges();
    expect(changes).toBe(false);
  });

  it('should handle file reading errors', async () => {
    (fs.readFile as unknown as jest.Mock).mockRejectedValue(new Error('File not found'));
    await expect(mockChangeDetector.detectChanges()).rejects.toThrow('File not found');
  });
}); 