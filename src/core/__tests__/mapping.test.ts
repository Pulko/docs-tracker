import fs from 'fs-extra';
import path from 'path';
import { Mapping } from '../mapping';

// Mock fs-extra
jest.mock('fs-extra');

describe('Mapping', () => {
  const mockProjectRoot = '/mock/project/root';
  const mockPackageJson = '{"name": "test-project"}';

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock process.cwd()
    jest.spyOn(process, 'cwd').mockReturnValue(mockProjectRoot);

    // Mock fs.existsSync for package.json
    (fs.existsSync as jest.Mock).mockImplementation((filePath) => {
      return filePath === path.join(mockProjectRoot, 'package.json');
    });

    // Mock fs.readFileSync
    (fs.readFileSync as jest.Mock).mockReturnValue(mockPackageJson);
  });

  describe('constructor', () => {
    it('should create a mapping with line ranges', () => {
      const mapping = new Mapping('src/index.ts:10-20', 'docs/api.md:5-15');
      const source = mapping.getSource();
      const target = mapping.getTarget();

      expect(source.file).toBe('src/index.ts');
      expect(source.isCharacterRange).toBe(false);
      expect(source.startLine).toBe(10);
      expect(source.endLine).toBe(20);

      expect(target.file).toBe('docs/api.md');
      expect(target.isCharacterRange).toBe(false);
      expect(target.startLine).toBe(5);
      expect(target.endLine).toBe(15);
    });

    it('should create a mapping with character ranges', () => {
      const mapping = new Mapping('src/index.ts:10@5-15', 'docs/api.md:5@10-20');
      const source = mapping.getSource();
      const target = mapping.getTarget();

      expect(source.file).toBe('src/index.ts');
      expect(source.isCharacterRange).toBe(true);
      expect(source.line).toBe(10);
      expect(source.startChar).toBe(5);
      expect(source.endChar).toBe(15);

      expect(target.file).toBe('docs/api.md');
      expect(target.isCharacterRange).toBe(true);
      expect(target.line).toBe(5);
      expect(target.startChar).toBe(10);
      expect(target.endChar).toBe(20);
    });

    it('should throw error for invalid range format', () => {
      expect(() => new Mapping('invalid', 'docs/api.md:5-15')).toThrow('Invalid range format');
      expect(() => new Mapping('src/index.ts:10-20', 'invalid')).toThrow('Invalid range format');
    });
  });

  describe('validate', () => {
    it('should validate file existence', () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath) => {
        return filePath === path.join(mockProjectRoot, 'package.json');
      });

      const mapping = new Mapping('src/index.ts:10-20', 'docs/api.md:5-15');
      const errors = mapping.validate(['file-type', 'project-structure', 'range-order', 'line-range', 'target-range']);

      expect(errors).toContain('Source file not found: src/index.ts');
      expect(errors).toContain('Target file not found: docs/api.md');
    });

    it('should validate file types', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const mapping = new Mapping('src/index.ts:10-20', 'docs/api.md:5-15');
      const errors = mapping.validate(['file-existence', 'project-structure', 'range-order', 'line-range', 'target-range']);

      expect(errors).toHaveLength(0);
    });

    it('should validate range order', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const mapping = new Mapping('src/index.ts:20-10', 'docs/api.md:15-5');
      const errors = mapping.validate(['file-existence', 'file-type', 'project-structure', 'line-range', 'target-range']);

      expect(errors).toContain('Invalid line range order: 20-10');
      expect(errors).toContain('Invalid target line range order: 15-5');
    });

    it('should validate line ranges', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('line1\nline2\nline3');

      const mapping = new Mapping('src/index.ts:1-5', 'docs/api.md:1-5');
      const errors = mapping.validate(['file-existence', 'file-type', 'project-structure', 'range-order', 'target-range']);

      expect(errors).toContain('Source line range 1-5 exceeds file length 3');
    });
  });

  describe('toString', () => {
    it('should format line ranges correctly', () => {
      const mapping = new Mapping('src/index.ts:10-20', 'docs/api.md:5-15');
      expect(mapping.toString()).toBe('src/index.ts:10-20 -> docs/api.md:5-15');
    });

    it('should format character ranges correctly', () => {
      const mapping = new Mapping('src/index.ts:10@5-15', 'docs/api.md:5@10-20');
      expect(mapping.toString()).toBe('src/index.ts:10[5-15] -> docs/api.md:5[10-20]');
    });
  });
}); 