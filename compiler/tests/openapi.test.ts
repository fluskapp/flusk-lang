import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import yaml from 'js-yaml';
import { generateOpenApi } from '../src/commands/openapi.js';

describe('openapi generator', () => {
  let tmpDir: string;
  let schemaDir: string;
  let generatedDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `flusk-openapi-${Date.now()}`);
    schemaDir = join(tmpDir, 'schema');
    generatedDir = join(tmpDir, 'generated');
    mkdirSync(join(schemaDir, 'entities'), { recursive: true });
    mkdirSync(join(schemaDir, 'routes'), { recursive: true });
    mkdirSync(join(schemaDir, 'functions'), { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('generates a valid OpenAPI 3.1 spec', () => {
    writeFileSync(join(schemaDir, 'entities', 'user.entity.yaml'), yaml.dump({
      name: 'User',
      description: 'A user',
      fields: [
        { name: 'id', type: 'uuid', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'name', type: 'string', required: false },
      ],
    }));

    writeFileSync(join(schemaDir, 'routes', 'users.route.yaml'), yaml.dump({
      name: 'users',
      basePath: '/api/users',
      entity: 'User',
      operations: [
        { method: 'GET', path: '', call: 'listUsers', description: 'List users' },
        { method: 'POST', path: '', call: 'createUser', description: 'Create user' },
        { method: 'GET', path: '/:id', call: 'getUser' },
      ],
    }));

    const outputPath = generateOpenApi(schemaDir, generatedDir);
    expect(outputPath).toContain('openapi.yaml');

    const content = readFileSync(outputPath, 'utf-8');
    const spec = yaml.load(content) as Record<string, unknown>;
    expect(spec.openapi).toBe('3.1.0');

    const paths = spec.paths as Record<string, Record<string, unknown>>;
    expect(paths['/api/users']).toBeDefined();
    expect(paths['/api/users/:id']).toBeDefined();

    const components = spec.components as Record<string, Record<string, unknown>>;
    expect(components.schemas.User).toBeDefined();
  });

  it('handles empty schema directory', () => {
    const outputPath = generateOpenApi(schemaDir, generatedDir);
    const content = readFileSync(outputPath, 'utf-8');
    const spec = yaml.load(content) as Record<string, unknown>;
    expect(spec.openapi).toBe('3.1.0');
    expect(Object.keys(spec.paths as Record<string, unknown>)).toHaveLength(0);
  });
});
