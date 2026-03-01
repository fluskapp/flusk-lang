import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import yaml from 'js-yaml';
import { generateClient } from '../src/commands/client-sdk.js';

describe('client SDK generator', () => {
  let tmpDir: string;
  let schemaDir: string;
  let generatedDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `flusk-client-${Date.now()}`);
    schemaDir = join(tmpDir, 'schema');
    generatedDir = join(tmpDir, 'generated');
    mkdirSync(join(schemaDir, 'entities'), { recursive: true });
    mkdirSync(join(schemaDir, 'routes'), { recursive: true });
    mkdirSync(join(schemaDir, 'functions'), { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('generates typed client with entity types', () => {
    writeFileSync(join(schemaDir, 'entities', 'bot.entity.yaml'), yaml.dump({
      name: 'Bot',
      fields: [
        { name: 'id', type: 'uuid' },
        { name: 'name', type: 'string' },
        { name: 'active', type: 'boolean', required: false },
      ],
    }));

    writeFileSync(join(schemaDir, 'routes', 'bots.route.yaml'), yaml.dump({
      name: 'bots',
      basePath: '/api/bots',
      entity: 'Bot',
      operations: [
        { method: 'GET', path: '', call: 'listBots' },
        { method: 'POST', path: '', call: 'createBot' },
        { method: 'GET', path: '/:id', call: 'getBot' },
        { method: 'DELETE', path: '/:id', call: 'deleteBot' },
      ],
    }));

    const clientDir = generateClient(schemaDir, generatedDir);
    expect(existsSync(join(clientDir, 'index.ts'))).toBe(true);
    expect(existsSync(join(clientDir, 'types', 'Bot.ts'))).toBe(true);
    expect(existsSync(join(clientDir, 'types', 'index.ts'))).toBe(true);

    const clientCode = readFileSync(join(clientDir, 'index.ts'), 'utf-8');
    expect(clientCode).toContain('class FluskClient');
    expect(clientCode).toContain('listBots');
    expect(clientCode).toContain('createBot');
    expect(clientCode).toContain('getBot');
    expect(clientCode).toContain('deleteBot');
    expect(clientCode).not.toContain('any');

    const typeCode = readFileSync(join(clientDir, 'types', 'Bot.ts'), 'utf-8');
    expect(typeCode).toContain('interface Bot');
    expect(typeCode).toContain('name: string');
    expect(typeCode).toContain('active?: boolean');
  });

  it('handles empty schema', () => {
    const clientDir = generateClient(schemaDir, generatedDir);
    const clientCode = readFileSync(join(clientDir, 'index.ts'), 'utf-8');
    expect(clientCode).toContain('class FluskClient');
  });
});
