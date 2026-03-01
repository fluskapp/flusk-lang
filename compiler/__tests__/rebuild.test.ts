import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { rebuildAll } from '../src/commands/rebuild.js';

describe('rebuildAll', () => {
  it('runs validate + build without error on empty schema', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'flusk-rebuild-'));
    const schemaDir = join(tempDir, 'schema');
    const generatedDir = join(tempDir, 'generated');
    mkdirSync(schemaDir, { recursive: true });
    mkdirSync(generatedDir, { recursive: true });

    expect(() => rebuildAll(schemaDir, generatedDir)).not.toThrow();

    rmSync(tempDir, { recursive: true, force: true });
  });

  it('throws on invalid schema content', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'flusk-rebuild-'));
    const schemaDir = join(tempDir, 'schema');
    const entDir = join(schemaDir, 'entities');
    const generatedDir = join(tempDir, 'generated');
    mkdirSync(entDir, { recursive: true });
    mkdirSync(generatedDir, { recursive: true });

    const { writeFileSync } = require('node:fs');
    writeFileSync(
      join(entDir, 'bad.entity.yaml'),
      'not: valid: entity'
    );

    expect(() => rebuildAll(schemaDir, generatedDir)).toThrow();

    rmSync(tempDir, { recursive: true, force: true });
  });
});
