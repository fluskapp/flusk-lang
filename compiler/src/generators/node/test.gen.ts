/**
 * Test Generator — produces test files from feature test definitions
 */

import type { FeatureNode } from '../../ast/feature.js';

const toCamel = (s: string): string => {
  const parts = s.split(/[-_ ]+/);
  return parts[0] + parts.slice(1).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
};

const toPascal = (s: string): string =>
  s.split(/[-_ ]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');

export interface GeneratedTest {
  path: string;
  content: string;
}

export const generateIntegrationTests = (feature: FeatureNode): GeneratedTest[] => {
  const tests: GeneratedTest[] = [];

  if (!feature.tests?.integration?.length) return tests;

  for (const test of feature.tests.integration) {
    const lines: string[] = [];
    lines.push(`import { describe, it, expect, beforeAll } from 'vitest';`);
    lines.push(`import { createServer } from '../helpers/server.js';`);
    lines.push('');
    lines.push(`describe('${feature.name} — ${test.name}', () => {`);
    lines.push(`  let app: Awaited<ReturnType<typeof createServer>>;`);
    lines.push('');
    lines.push(`  beforeAll(async () => {`);
    lines.push(`    app = await createServer();`);
    lines.push(`  });`);
    lines.push('');

    lines.push(`  it('${test.name}', async () => {`);

    for (const step of test.steps) {
      switch (step.type) {
        case 'post':
        case 'get':
        case 'put':
        case 'delete': {
          const method = step.type.toUpperCase();
          const bodyStr = step.body ? `, { json: ${JSON.stringify(step.body)} }` : '';
          const headerStr = step.headers
            ? `\n      headers: ${JSON.stringify(step.headers)},`
            : '';

          lines.push(`    const res = await app.inject({`);
          lines.push(`      method: '${method}',`);
          lines.push(`      url: '${step.path}',${headerStr}`);
          if (step.body) {
            lines.push(`      payload: ${JSON.stringify(step.body)},`);
          }
          lines.push(`    });`);

          if (step.expect?.status) {
            lines.push(`    expect(res.statusCode).toBe(${step.expect.status});`);
          }
          lines.push('');
          break;
        }
        case 'wait': {
          lines.push(`    // Wait for worker: ${step.target}`);
          lines.push(`    await new Promise((r) => setTimeout(r, 100));`);
          lines.push('');
          break;
        }
        case 'assert': {
          lines.push(`    // Assert: ${step.condition}`);
          lines.push(`    // TODO: implement assertion`);
          lines.push('');
          break;
        }
        case 'auth': {
          lines.push(`    // Auth: ${step.target}`);
          lines.push(`    const token = 'test-token';`);
          lines.push('');
          break;
        }
      }
    }

    lines.push(`  });`);
    lines.push(`});`);
    lines.push('');

    tests.push({
      path: `__tests__/integration/${feature.name}-${test.name}.test.ts`,
      content: lines.join('\n'),
    });
  }

  return tests;
};

export const generateEntityTests = (feature: FeatureNode): GeneratedTest[] => {
  const tests: GeneratedTest[] = [];

  for (const entity of feature.entities) {
    const pascal = toPascal(entity.name);
    const camel = toCamel(entity.name);
    const lines: string[] = [];

    lines.push(`import { describe, it, expect } from 'vitest';`);
    lines.push(`import { ${pascal}Repository } from '../src/entities/${camel}.repository.js';`);
    lines.push('');
    lines.push(`describe('${pascal} Entity', () => {`);

    // Basic CRUD tests
    lines.push(`  it('creates a ${camel}', async () => {`);
    lines.push(`    const repo = new ${pascal}Repository();`);
    lines.push(`    const data = {`);
    for (const field of entity.fields) {
      const val = field.type === 'string' ? `'test-${field.name}'`
        : field.type === 'number' ? '1'
        : field.type === 'boolean' ? 'true'
        : field.type === 'enum' ? `'${field.values?.[0] ?? 'default'}'`
        : `'test'`;
      lines.push(`      ${field.name}: ${val},`);
    }
    lines.push(`    };`);
    lines.push(`    const result = await repo.create(data);`);
    lines.push(`    expect(result).toBeDefined();`);
    lines.push(`    expect(result.id).toBeDefined();`);
    lines.push(`  });`);

    // Query tests
    for (const query of entity.queries ?? []) {
      lines.push('');
      lines.push(`  it('${query.name}', async () => {`);
      lines.push(`    const repo = new ${pascal}Repository();`);
      lines.push(`    const result = await repo.${query.name}();`);
      lines.push(`    expect(Array.isArray(result)).toBe(true);`);
      lines.push(`  });`);
    }

    lines.push(`});`);
    lines.push('');

    tests.push({
      path: `__tests__/entities/${camel}.test.ts`,
      content: lines.join('\n'),
    });
  }

  return tests;
};

export const generateAllTests = (feature: FeatureNode): GeneratedTest[] => {
  return [
    ...generateEntityTests(feature),
    ...generateIntegrationTests(feature),
  ];
};
