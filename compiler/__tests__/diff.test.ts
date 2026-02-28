import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { parseFeatureFromString } from '../src/parsers/feature.parser.js';
import { explodeFeature } from '../src/exploder/exploder.js';
import { writeExploded } from '../src/exploder/writer.js';
import { diffFeature } from '../src/exploder/diff.js';

const tmpDir = join('/tmp', 'flusk-diff-test');

beforeEach(() => {
  mkdirSync(tmpDir, { recursive: true });
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

const makeFeature = (yamlStr: string) => {
  const feature = parseFeatureFromString(yamlStr);
  return explodeFeature(feature);
};

describe('Diff Engine', () => {
  it('detects all files as added when schema dir is empty', () => {
    const exploded = makeFeature(`
name: test
entities:
  - name: user
    fields:
      - name: email
        type: string
`);
    const changeset = diffFeature(exploded, tmpDir);
    expect(changeset.summary.added).toBe(1);
    expect(changeset.summary.modified).toBe(0);
    expect(changeset.summary.unchanged).toBe(0);
    expect(changeset.files[0].kind).toBe('added');
  });

  it('detects unchanged files', () => {
    const exploded = makeFeature(`
name: test
entities:
  - name: user
    fields:
      - name: email
        type: string
`);
    // Write first, then diff again
    writeExploded(exploded, tmpDir, { overwrite: true });
    const changeset = diffFeature(exploded, tmpDir);
    expect(changeset.summary.unchanged).toBe(1);
    expect(changeset.summary.modified).toBe(0);
  });

  it('detects modified files', () => {
    const v1 = makeFeature(`
name: test
entities:
  - name: user
    fields:
      - name: email
        type: string
`);
    writeExploded(v1, tmpDir, { overwrite: true });

    const v2 = makeFeature(`
name: test
entities:
  - name: user
    fields:
      - name: email
        type: string
      - name: name
        type: string
`);
    const changeset = diffFeature(v2, tmpDir);
    expect(changeset.summary.modified).toBe(1);
    expect(changeset.files[0].kind).toBe('modified');
  });

  it('detects added fields', () => {
    const v1 = makeFeature(`
name: test
entities:
  - name: user
    fields:
      - name: email
        type: string
`);
    writeExploded(v1, tmpDir, { overwrite: true });

    const v2 = makeFeature(`
name: test
entities:
  - name: user
    fields:
      - name: email
        type: string
      - name: phone
        type: string
`);
    const changeset = diffFeature(v2, tmpDir);
    expect(changeset.fields).toHaveLength(1);
    expect(changeset.fields[0].kind).toBe('added');
    expect(changeset.fields[0].field).toBe('phone');
  });

  it('detects removed fields as breaking', () => {
    const v1 = makeFeature(`
name: test
entities:
  - name: user
    fields:
      - name: email
        type: string
      - name: phone
        type: string
`);
    writeExploded(v1, tmpDir, { overwrite: true });

    const v2 = makeFeature(`
name: test
entities:
  - name: user
    fields:
      - name: email
        type: string
`);
    const changeset = diffFeature(v2, tmpDir);
    expect(changeset.fields).toHaveLength(1);
    expect(changeset.fields[0].kind).toBe('removed');
    expect(changeset.breaking).toHaveLength(1);
    expect(changeset.breaking[0].type).toBe('field-removed');
  });

  it('detects type changes as breaking', () => {
    const v1 = makeFeature(`
name: test
entities:
  - name: user
    fields:
      - name: age
        type: string
`);
    writeExploded(v1, tmpDir, { overwrite: true });

    const v2 = makeFeature(`
name: test
entities:
  - name: user
    fields:
      - name: age
        type: number
`);
    const changeset = diffFeature(v2, tmpDir);
    expect(changeset.fields.some((f) => f.kind === 'type-changed')).toBe(true);
    expect(changeset.breaking).toHaveLength(1);
    expect(changeset.breaking[0].type).toBe('field-type-changed');
  });

  it('detects default value changes', () => {
    const v1 = makeFeature(`
name: test
entities:
  - name: user
    fields:
      - name: role
        type: string
        default: user
`);
    writeExploded(v1, tmpDir, { overwrite: true });

    const v2 = makeFeature(`
name: test
entities:
  - name: user
    fields:
      - name: role
        type: string
        default: admin
`);
    const changeset = diffFeature(v2, tmpDir);
    expect(changeset.fields.some((f) => f.kind === 'default-changed')).toBe(true);
  });

  it('detects constraint changes', () => {
    const v1 = makeFeature(`
name: test
entities:
  - name: user
    fields:
      - name: email
        type: string
`);
    writeExploded(v1, tmpDir, { overwrite: true });

    const v2 = makeFeature(`
name: test
entities:
  - name: user
    fields:
      - name: email
        type: string
        unique: true
`);
    const changeset = diffFeature(v2, tmpDir);
    expect(changeset.fields.some((f) => f.kind === 'constraint-changed')).toBe(true);
  });

  it('handles multi-entity features', () => {
    const v1 = makeFeature(`
name: blog
entities:
  - name: post
    fields:
      - name: title
        type: string
  - name: comment
    fields:
      - name: body
        type: string
`);
    writeExploded(v1, tmpDir, { overwrite: true });

    const v2 = makeFeature(`
name: blog
entities:
  - name: post
    fields:
      - name: title
        type: string
      - name: slug
        type: string
  - name: comment
    fields:
      - name: body
        type: string
      - name: author
        type: string
`);
    const changeset = diffFeature(v2, tmpDir);
    expect(changeset.summary.modified).toBe(2);
    expect(changeset.fields).toHaveLength(2);
    expect(changeset.fields[0].field).toBe('slug');
    expect(changeset.fields[1].field).toBe('author');
  });

  it('produces correct summary', () => {
    const v1 = makeFeature(`
name: test
entities:
  - name: user
    fields:
      - name: email
        type: string
routes:
  - name: get-users
    method: GET
    path: /users
`);
    writeExploded(v1, tmpDir, { overwrite: true });

    // Modify entity, keep route
    const v2 = makeFeature(`
name: test
entities:
  - name: user
    fields:
      - name: email
        type: string
      - name: name
        type: string
routes:
  - name: get-users
    method: GET
    path: /users
`);
    const changeset = diffFeature(v2, tmpDir);
    expect(changeset.summary.modified).toBeGreaterThanOrEqual(1);
    expect(changeset.breaking).toHaveLength(0);
  });
});
