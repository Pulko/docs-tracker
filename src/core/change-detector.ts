import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { Mapping } from './mapping';

export class ChangeDetector {
  private readonly mapping: Mapping;

  constructor(mapping: Mapping) {
    this.mapping = mapping;
  }

  public async detectChanges(): Promise<boolean> {
    const sourceContent = await this.readSourceContent();
    const targetContent = await this.readTargetContent();
    
    const sourceHash = this.calculateHash(sourceContent);
    const targetHash = this.calculateHash(targetContent);

    return sourceHash !== targetHash;
  }

  private async readSourceContent(): Promise<string> {
    const source = this.mapping.getSource();
    const filePath = path.join(this.mapping.getProjectRoot(), source.file);
    const content = await fs.readFile(filePath, 'utf-8');

    if (source.isCharacterRange) {
      const lines = content.split('\n');
      const line = lines[source.line! - 1];
      return line.substring(source.startChar! - 1, source.endChar!);
    } else {
      const lines = content.split('\n');
      return lines.slice(source.startLine! - 1, source.endLine!).join('\n');
    }
  }

  private async readTargetContent(): Promise<string> {
    const target = this.mapping.getTarget();
    const filePath = path.join(this.mapping.getProjectRoot(), target.file);
    const content = await fs.readFile(filePath, 'utf-8');

    if (target.isCharacterRange) {
      const lines = content.split('\n');
      const line = lines[target.line! - 1];
      return line.substring(target.startChar! - 1, target.endChar!);
    } else {
      const lines = content.split('\n');
      return lines.slice(target.startLine! - 1, target.endLine!).join('\n');
    }
  }

  private calculateHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }
} 