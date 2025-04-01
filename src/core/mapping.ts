import fs from 'fs-extra';
import path from 'path';

interface Range {
  file: string;
  isCharacterRange: boolean;
  line?: number;
  startChar?: number;
  endChar?: number;
  startLine?: number;
  endLine?: number;
}

export class Mapping {
  private readonly projectRoot: string;
  private readonly source: Range;
  private readonly target: Range;

  constructor(source: string, target: string) {
    this.projectRoot = this.findProjectRoot();
    this.source = this.parseRange(source);
    this.target = this.parseRange(target);
  }

  private findProjectRoot(): string {
    let currentDir = process.cwd();
    const projectMarkers = [
      'package.json',    // Node.js
      '.git',           // Git repository
      'pom.xml',        // Maven (Java)
      'build.gradle',   // Gradle (Java)
      'requirements.txt', // Python
      'Cargo.toml',     // Rust
      'go.mod',         // Go
      'Gemfile',        // Ruby
      'composer.json'   // PHP
    ];

    while (currentDir !== '/') {
      for (const marker of projectMarkers) {
        if (fs.existsSync(path.join(currentDir, marker))) {
          return currentDir;
        }
      }
      currentDir = path.dirname(currentDir);
    }

    // If no project root markers found, use current directory
    return process.cwd();
  }

  private parseRange(range: string): Range {
    const [file, location] = range.split(':');
    if (!file || !location) {
      throw new Error(`Invalid range format: ${range}`);
    }

    const isCharacterRange = location.includes('@');
    if (isCharacterRange) {
      const [line, chars] = location.split('@');
      const [startChar, endChar] = chars.split('-').map(Number);
      return {
        file,
        isCharacterRange: true,
        line: Number(line),
        startChar,
        endChar
      };
    } else {
      const [startLine, endLine] = location.split('-').map(Number);
      return {
        file,
        isCharacterRange: false,
        startLine,
        endLine
      };
    }
  }

  private validateFileType(filePath: string): string | null {
    const ext = path.extname(filePath).toLowerCase();
    const isSourceFile = /\.(js|jsx|ts|tsx|py|java|c|cpp|cs|go|rb|php|swift|kt|scala|rs|r|m|mm|h|hpp|cc|cs|fs|vb|clj|ex|exs|erl|hs|lua|ml|mli|pl|pm|rkt|sh|sql|styl|vue|svelte)$/.test(ext);
    const isDocFile = /\.(md|txt|rst|adoc|doc|docx|pdf)$/.test(ext);
    
    if (!isSourceFile && !isDocFile) {
      return `File type not supported: ${ext}`;
    }
    return null;
  }

  private validateProjectStructure(filePath: string): string | null {
    const relativePath = path.relative(this.projectRoot, filePath);
    
    if (relativePath.startsWith('..')) {
      return `File is outside project root: ${relativePath}`;
    }

    const isInDocDir = /^(docs?|documentation|api-docs?|guides?|tutorials?|examples?)/i.test(relativePath);
    const isSourceFile = this.validateFileType(filePath)?.includes('source file');
    
    if (isSourceFile && isInDocDir) {
      return `Source file should not be in documentation directory: ${relativePath}`;
    }

    return null;
  }

  private validateRangeOrder(): string[] {
    const errors: string[] = [];

    if (this.source.isCharacterRange) {
      if (this.source.startChar! >= this.source.endChar!) {
        errors.push(`Invalid character range order: ${this.source.startChar}-${this.source.endChar}`);
      }
    } else {
      if (this.source.startLine! >= this.source.endLine!) {
        errors.push(`Invalid line range order: ${this.source.startLine}-${this.source.endLine}`);
      }
    }

    if (this.target.isCharacterRange) {
      if (this.target.startChar! >= this.target.endChar!) {
        errors.push(`Invalid target character range order: ${this.target.startChar}-${this.target.endChar}`);
      }
    } else {
      if (this.target.startLine! >= this.target.endLine!) {
        errors.push(`Invalid target line range order: ${this.target.startLine}-${this.target.endLine}`);
      }
    }

    return errors;
  }

  public validate(ignoreRules: string[] = []): string[] {
    const errors: string[] = [];

    if (!ignoreRules.includes('file-existence')) {
      if (!fs.existsSync(this.source.file)) {
        errors.push(`Source file not found: ${this.source.file}`);
      }
      if (!fs.existsSync(this.target.file)) {
        errors.push(`Target file not found: ${this.target.file}`);
      }
    }

    if (errors.length > 0) return errors;

    if (!ignoreRules.includes('file-type')) {
      const sourceFileTypeError = this.validateFileType(this.source.file);
      if (sourceFileTypeError) {
        errors.push(`Source ${sourceFileTypeError}`);
      }

      const targetFileTypeError = this.validateFileType(this.target.file);
      if (targetFileTypeError) {
        errors.push(`Target ${targetFileTypeError}`);
      }
    }

    if (!ignoreRules.includes('project-structure')) {
      const sourceStructureError = this.validateProjectStructure(this.source.file);
      if (sourceStructureError) {
        errors.push(sourceStructureError);
      }

      const targetStructureError = this.validateProjectStructure(this.target.file);
      if (targetStructureError) {
        errors.push(targetStructureError);
      }
    }

    if (!ignoreRules.includes('range-order')) {
      const rangeOrderErrors = this.validateRangeOrder();
      errors.push(...rangeOrderErrors);
    }

    if (!ignoreRules.includes('line-range')) {
      if (this.source.isCharacterRange) {
        const sourceContent = fs.readFileSync(this.source.file, 'utf8');
        const lines = sourceContent.split('\n');
        if (this.source.line! > lines.length) {
          errors.push(`Source line ${this.source.line} exceeds file length`);
        } else {
          const lineLength = lines[this.source.line! - 1].length;
          if (this.source.endChar! > lineLength) {
            errors.push(`Character range ${this.source.startChar}-${this.source.endChar} exceeds line length ${lineLength}`);
          }
        }
      } else {
        const sourceContent = fs.readFileSync(this.source.file, 'utf8');
        const lineCount = sourceContent.split('\n').length;
        if (this.source.endLine! > lineCount) {
          errors.push(`Source line range ${this.source.startLine}-${this.source.endLine} exceeds file length ${lineCount}`);
        }
      }
    }

    if (!ignoreRules.includes('target-range')) {
      if (this.target.isCharacterRange) {
        const targetContent = fs.readFileSync(this.target.file, 'utf8');
        const lines = targetContent.split('\n');
        if (this.target.line! > lines.length) {
          errors.push(`Target line ${this.target.line} exceeds file length`);
        } else {
          const lineLength = lines[this.target.line! - 1].length;
          if (this.target.endChar! > lineLength) {
            errors.push(`Target character range ${this.target.startChar}-${this.target.endChar} exceeds line length ${lineLength}`);
          }
        }
      } else {
        const targetContent = fs.readFileSync(this.target.file, 'utf8');
        const lineCount = targetContent.split('\n').length;
        if (this.target.endLine! > lineCount) {
          errors.push(`Target line range ${this.target.startLine}-${this.target.endLine} exceeds file length ${lineCount}`);
        }
      }
    }

    return errors;
  }

  public toString(): string {
    const sourceStr = this.source.isCharacterRange
      ? `${this.source.file}:${this.source.line}[${this.source.startChar}-${this.source.endChar}]`
      : `${this.source.file}:${this.source.startLine}-${this.source.endLine}`;

    const targetStr = this.target.isCharacterRange
      ? `${this.target.file}:${this.target.line}[${this.target.startChar}-${this.target.endChar}]`
      : `${this.target.file}:${this.target.startLine}-${this.target.endLine}`;

    return `${sourceStr} -> ${targetStr}`;
  }

  public getSource(): Range {
    return this.source;
  }

  public getTarget(): Range {
    return this.target;
  }

  public getProjectRoot(): string {
    return this.projectRoot;
  }
} 