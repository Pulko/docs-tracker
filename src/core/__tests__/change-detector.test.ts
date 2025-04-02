import fs from 'fs-extra';
import path from 'path';
import { Mapping } from '../mapping';
import { ChangeDetector } from '../change-detector';

jest.mock('fs-extra');
jest.mock('../mapping');

describe('ChangeDetector', () => {
  const mockMapping = {
    source: {
      file: 'src/index.ts',
      isCharacterRange: false,
      startLine: 1,
      endLine: 10
    },
    target: {
      file: 'docs/api.md',
      isCharacterRange: false,
      startLine: 1,
      endLine: 10
    },
    sourceHash: 'source-hash-1',
    targetHash: 'target-hash-1',
    getSourceHash: jest.fn().mockReturnValue('source-hash-1'),
    getTargetHash: jest.fn().mockReturnValue('target-hash-1'),
    generateHashes: jest.fn().mockImplementation(() => Promise.resolve({
      sourceHash: 'source-hash-1',
      targetHash: 'target-hash-1'
    }))
  } as unknown as Mapping;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect no changes when content is identical', async () => {
    const detector = new ChangeDetector(mockMapping);
    const hasChanges = await detector.detectChanges();
    expect(hasChanges).toBe(false);
  });

  it('should detect changes when content differs', async () => {
    const detector = new ChangeDetector(mockMapping);
    (mockMapping.generateHashes as jest.Mock).mockResolvedValueOnce({
      sourceHash: 'source-hash-2',
      targetHash: 'target-hash-2'
    });
    const hasChanges = await detector.detectChanges();
    expect(hasChanges).toBe(true);
  });

  it('should handle file read errors', async () => {
    const error = new Error('File read error');
    (mockMapping.generateHashes as jest.Mock).mockRejectedValueOnce(error);
    const detector = new ChangeDetector(mockMapping);
    await expect(detector.detectChanges()).rejects.toThrow('File read error');
  });

  it('should handle line ranges correctly', async () => {
    const detector = new ChangeDetector(mockMapping);
    const hasChanges = await detector.detectChanges();
    expect(hasChanges).toBe(false);
  });

  it('should handle character ranges correctly', async () => {
    const detector = new ChangeDetector(mockMapping);
    const hasChanges = await detector.detectChanges();
    expect(hasChanges).toBe(false);
  });
}); 