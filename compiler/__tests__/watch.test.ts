import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { watchSchemas } from '../src/commands/watch.js';
import type { WatchEvent } from '../src/commands/watch-types.js';

describe('watch command', () => {
  let tempDir: string;
  let schemaDir: string;
  let generatedDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'flusk-watch-'));
    schemaDir = join(tempDir, 'schema');
    generatedDir = join(tempDir, 'generated');
    mkdirSync(join(schemaDir, 'entities'), { recursive: true });
    mkdirSync(generatedDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('emits start event on init', () => {
    const events: WatchEvent[] = [];
    const ac = watchSchemas({
      schemaDir,
      generatedDir,
      onEvent: (e) => events.push(e),
    });
    ac.abort();

    expect(events[0]?.type).toBe('start');
  });

  it('detects yaml file changes', async () => {
    const events: WatchEvent[] = [];
    const ac = watchSchemas({
      schemaDir,
      generatedDir,
      onEvent: (e) => events.push(e),
    });

    // Write a yaml file to trigger the watcher
    await new Promise((r) => setTimeout(r, 100));
    writeFileSync(
      join(schemaDir, 'entities', 'test.entity.yaml'),
      'name: test\ntype: entity\nfields:\n  id:\n    type: uuid\n    primary: true\n'
    );

    // Wait for watcher to pick it up
    await new Promise((r) => setTimeout(r, 500));
    ac.abort();

    const changeEvent = events.find((e) => e.type === 'change');
    expect(changeEvent).toBeDefined();
  });

  it('ignores non-yaml files', async () => {
    const events: WatchEvent[] = [];
    const ac = watchSchemas({
      schemaDir,
      generatedDir,
      onEvent: (e) => events.push(e),
    });

    await new Promise((r) => setTimeout(r, 100));
    writeFileSync(join(schemaDir, 'readme.txt'), 'hello');

    await new Promise((r) => setTimeout(r, 500));
    ac.abort();

    const changeEvent = events.find((e) => e.type === 'change');
    expect(changeEvent).toBeUndefined();
  });

  it('reports errors for invalid yaml schemas', async () => {
    const events: WatchEvent[] = [];
    const ac = watchSchemas({
      schemaDir,
      generatedDir,
      onEvent: (e) => events.push(e),
    });

    await new Promise((r) => setTimeout(r, 100));
    writeFileSync(
      join(schemaDir, 'entities', 'bad.entity.yaml'),
      'this is not valid schema yaml'
    );

    await new Promise((r) => setTimeout(r, 500));
    ac.abort();

    const errorEvent = events.find((e) => e.type === 'error');
    expect(errorEvent).toBeDefined();
  });
});
