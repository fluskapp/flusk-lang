import { describe, it, expect } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { FluskSchema } from '../src/parsers/saas-schema.parser.js';
import { TypeGenerator } from '../src/generators/saas/type.gen.js';
import { APIClientGenerator } from '../src/generators/saas/api-client.gen.js';
import { FormGenerator } from '../src/generators/saas/form.gen.js';
import { RouterGenerator } from '../src/generators/saas/router.gen.js';
import { PlatformaticGenerator } from '../src/generators/saas/platformatic.gen.js';

function tmpDir(): string {
  const dir = join(tmpdir(), `flusk-saas-test-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function cleanup(dir: string) {
  try { rmSync(dir, { recursive: true, force: true }); } catch {}
}

const entitySchema: FluskSchema = {
  name: 'product',
  type: 'entity',
  description: 'A product',
  _metadata: { filePath: '/schemas/entities/product.yaml', fileName: 'product', directory: 'entities' },
  fields: {
    id: { type: 'uuid', primary: true, required: true },
    name: { type: 'string', required: true },
    price: { type: 'integer', required: false },
    status: { type: 'enum', values: ['active', 'paused'], required: false },
    enabled: { type: 'boolean', required: false },
  },
};

const routeSchema: FluskSchema = {
  name: 'products',
  type: 'entity',
  _metadata: { filePath: '/schemas/routes/products.yaml', fileName: 'products', directory: 'routes' },
  fields: {},
} as unknown as FluskSchema;

// Cast to unknown to add route-specific fields
const routeSchemaFull = {
  ...routeSchema,
  basePath: '/api/products',
  operations: [
    { method: 'GET', path: '/', description: 'List products' },
    { method: 'GET', path: '/:id', description: 'Get product' },
    { method: 'POST', path: '/', description: 'Create product' },
    { method: 'PATCH', path: '/:id', description: 'Update product' },
    { method: 'DELETE', path: '/:id', description: 'Delete product' },
  ],
} as unknown as FluskSchema;

const viewSchema: FluskSchema = {
  name: 'dashboard',
  type: 'dashboard',
  _metadata: { filePath: '/schemas/views/dashboard.yaml', fileName: 'dashboard', directory: 'views' },
} as unknown as FluskSchema;

// Add route field for RouterGenerator
const viewSchemaWithRoute = {
  ...viewSchema,
  route: '/$tenant/dashboard',
  sections: [{ type: 'page-header', title: 'Dashboard' }],
} as unknown as FluskSchema;

describe('TypeGenerator', () => {
  it('generates TypeScript interface and Zod schema for entity', async () => {
    const dir = tmpDir();
    try {
      const gen = new TypeGenerator();
      const result = await gen.generate([entitySchema], dir);
      expect(result.errors).toHaveLength(0);
      expect(result.filesGenerated).toBeGreaterThan(0);
      const content = await readFile(join(dir, 'types', 'Product.ts'), 'utf-8');
      expect(content).toContain('export interface Product');
      expect(content).toContain('ProductSchema = z.object');
      expect(content).toContain("'active' | 'paused'");
    } finally { cleanup(dir); }
  });

  it('generates barrel index.ts', async () => {
    const dir = tmpDir();
    try {
      const gen = new TypeGenerator();
      await gen.generate([entitySchema], dir);
      const index = await readFile(join(dir, 'types', 'index.ts'), 'utf-8');
      expect(index).toContain("export * from './Product'");
    } finally { cleanup(dir); }
  });
});

describe('APIClientGenerator', () => {
  it('generates hook file for route schema', async () => {
    const dir = tmpDir();
    try {
      const gen = new APIClientGenerator();
      const result = await gen.generate([routeSchemaFull], dir);
      expect(result.errors).toHaveLength(0);
      expect(result.filesGenerated).toBeGreaterThan(0);
      const content = await readFile(join(dir, 'hooks', 'useProducts.ts'), 'utf-8');
      expect(content).toContain('useProducts');
      expect(content).toContain('useQuery');
      expect(content).toContain('useMutation');
    } finally { cleanup(dir); }
  });

  it('generates api-client.ts', async () => {
    const dir = tmpDir();
    try {
      const gen = new APIClientGenerator();
      await gen.generate([routeSchemaFull], dir);
      const content = await readFile(join(dir, 'lib', 'api-client.ts'), 'utf-8');
      expect(content).toContain('export const apiClient');
    } finally { cleanup(dir); }
  });
});

describe('FormGenerator', () => {
  it('generates React form component for entity', async () => {
    const dir = tmpDir();
    try {
      const gen = new FormGenerator();
      const result = await gen.generate([entitySchema], dir);
      expect(result.errors).toHaveLength(0);
      const content = await readFile(join(dir, 'forms', 'ProductForm.tsx'), 'utf-8');
      expect(content).toContain('ProductForm');
      expect(content).toContain('zodResolver');
      expect(content).toContain("z.enum(['active', 'paused'])");
    } finally { cleanup(dir); }
  });
});

describe('RouterGenerator', () => {
  it('generates react-router config from view schemas', async () => {
    const dir = tmpDir();
    try {
      const gen = new RouterGenerator();
      const result = await gen.generate([viewSchemaWithRoute], dir);
      expect(result.errors).toHaveLength(0);
      const content = await readFile(join(dir, 'routes', 'index.tsx'), 'utf-8');
      expect(content).toContain('createBrowserRouter');
      expect(content).toContain('DashboardPage');
    } finally { cleanup(dir); }
  });
});

describe('PlatformaticGenerator', () => {
  it('generates SQL migration with CREATE TABLE', async () => {
    const dir = tmpDir();
    try {
      const gen = new PlatformaticGenerator();
      const result = await gen.generate([entitySchema, routeSchemaFull], dir);
      expect(result.errors).toHaveLength(0);
      expect(result.filesGenerated).toBeGreaterThan(0);
      const sql = await readFile(join(dir, 'backend', 'migrations', '001_initial.sql'), 'utf-8');
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS products');
      expect(sql).toContain('id TEXT PRIMARY KEY');
    } finally { cleanup(dir); }
  });

  it('generates platformatic.db.json config', async () => {
    const dir = tmpDir();
    try {
      const gen = new PlatformaticGenerator();
      await gen.generate([entitySchema], dir);
      const config = await readFile(join(dir, 'backend', 'platformatic.db.json'), 'utf-8');
      const parsed = JSON.parse(config);
      expect(parsed).toHaveProperty('db');
      expect(parsed.db.graphql).toBe(true);
    } finally { cleanup(dir); }
  });
});
