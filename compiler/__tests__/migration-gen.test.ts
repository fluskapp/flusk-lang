import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { parseFeatureFromString } from '../src/parsers/feature.parser.js';
import { explodeFeature } from '../src/exploder/exploder.js';
import { writeExploded } from '../src/exploder/writer.js';
import { diffFeature } from '../src/exploder/diff.js';
import { generateMigrations, generateFieldMigrations } from '../src/generators/node/migration.gen.js';

const tmpDir = join('/tmp', 'flusk-migration-test');

beforeEach(() => mkdirSync(tmpDir, { recursive: true }));
afterEach(() => rmSync(tmpDir, { recursive: true, force: true }));

describe('Migration Generator', () => {
  it('generates CREATE TABLE for new entities', () => {
    const feature = parseFeatureFromString(`
name: test
entities:
  - name: user
    fields:
      - name: email
        type: string
        unique: true
      - name: age
        type: number
`);
    const exploded = explodeFeature(feature);
    const changeset = diffFeature(exploded, tmpDir);
    const migrations = generateMigrations(changeset);

    expect(migrations).toHaveLength(1);
    expect(migrations[0].name).toContain('create_users');
    expect(migrations[0].up).toContain('CREATE TABLE');
    expect(migrations[0].up).toContain('email TEXT');
    expect(migrations[0].up).toContain('UNIQUE');
    expect(migrations[0].up).toContain('age INTEGER');
    expect(migrations[0].down).toContain('DROP TABLE');
  });

  it('generates ALTER TABLE for added fields', () => {
    const migrations = generateFieldMigrations([
      { entity: 'User', field: 'phone', kind: 'added', newValue: { type: 'string' } },
    ]);
    expect(migrations).toHaveLength(1);
    expect(migrations[0].up).toContain('ADD COLUMN phone TEXT');
    expect(migrations[0].down).toContain('DROP COLUMN phone');
  });

  it('generates DROP COLUMN for removed fields', () => {
    const migrations = generateFieldMigrations([
      { entity: 'User', field: 'phone', kind: 'removed', oldValue: { type: 'string' } },
    ]);
    expect(migrations[0].up).toContain('DROP COLUMN phone');
    expect(migrations[0].down).toContain('ADD COLUMN phone TEXT');
  });

  it('generates column rename for type changes', () => {
    const migrations = generateFieldMigrations([
      { entity: 'User', field: 'age', kind: 'type-changed', oldValue: 'string', newValue: 'number' },
    ]);
    expect(migrations[0].up).toContain('RENAME COLUMN age TO age_old');
    expect(migrations[0].up).toContain('ADD COLUMN age INTEGER');
    expect(migrations[0].up).toContain('CAST');
  });

  it('handles default values', () => {
    const migrations = generateFieldMigrations([
      { entity: 'User', field: 'role', kind: 'added', newValue: { type: 'string', default: 'user' } },
    ]);
    expect(migrations[0].up).toContain("DEFAULT 'user'");
  });

  it('handles boolean defaults', () => {
    const migrations = generateFieldMigrations([
      { entity: 'User', field: 'active', kind: 'added', newValue: { type: 'boolean', default: true } },
    ]);
    expect(migrations[0].up).toContain('DEFAULT 1');
  });

  it('groups changes by entity', () => {
    const migrations = generateFieldMigrations([
      { entity: 'User', field: 'phone', kind: 'added', newValue: { type: 'string' } },
      { entity: 'User', field: 'bio', kind: 'added', newValue: { type: 'string' } },
      { entity: 'Post', field: 'slug', kind: 'added', newValue: { type: 'string' } },
    ]);
    expect(migrations).toHaveLength(2);
    expect(migrations[0].name).toContain('users');
    expect(migrations[1].name).toContain('posts');
  });
});
