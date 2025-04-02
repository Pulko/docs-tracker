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
    const { sourceHash, targetHash } = await this.mapping.generateHashes();
    
    // Compare current hashes with stored hashes
    return sourceHash !== this.mapping.getSourceHash() || 
           targetHash !== this.mapping.getTargetHash();
  }

  private calculateHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }
} 