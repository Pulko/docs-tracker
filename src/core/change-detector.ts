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
} 