/**
 * Build Node.js target — generates TypeScript from YAML schemas
 * Produces a complete runnable Platformatic Watt backend
 */

import { join } from 'node:path';
import { existsSync, readdirSync, unlinkSync } from 'node:fs';
import { parseAll, validate } from '../index.js';
import { generateEntitySchema, generateEntityType } from '../generators/node/entity.gen.js';
import { generateFunction } from '../generators/node/function.gen.js';
import { generateCommand } from '../generators/node/command.gen.js';
import { generateRoute } from '../generators/node/route.gen.js';
import { generateProvider } from '../generators/node/provider.gen.js';
import { generateClient } from '../generators/node/client.gen.js';
import { generateBarrel } from '../generators/node/barrel.gen.js';
import { generateService } from '../generators/node/service.gen.js';
import { generateMiddleware } from '../generators/node/middleware.gen.js';
import { generatePlugin } from '../generators/node/plugin.gen.js';
import { generateEvent } from '../generators/node/event.gen.js';
import { generateWorker } from '../generators/node/worker.gen.js';
import { generateStream } from '../generators/node/stream.gen.js';
import { generateHook } from '../generators/node/hook.gen.js';
import { generateRepositoryImpl } from '../generators/node/repository.gen.js';
import { generateAllCreateMigrations } from '../generators/node/create-migration.gen.js';
import { generateAllWattFiles } from '../generators/node/watt.gen.js';
import { generateEntityTest } from '../generators/node/entity-test.gen.js';
import { generateRouteTest } from '../generators/node/route-test.gen.js';
import type { WriteFileFn } from './types.js';
import { createChildLogger } from '../logger.js';

const log = createChildLogger('build-node');

export const buildNode = (
  schemaDir: string,
  generatedDir: string,
  skipRefs: boolean,
  writeFile: WriteFileFn,
): void => {
  const schema = skipRefs ? parseAll(schemaDir) : validate(schemaDir);
  const nodeDir = join(generatedDir, 'node');
  const srcDir = join(nodeDir, 'src');
  const allFiles: string[] = [];

  // ── Entities ──────────────────────────────────
  for (const entity of schema.entities) {
    const name = entity.name.toLowerCase();
    writeFile(join(srcDir, 'entities', `${name}.schema.ts`), generateEntitySchema(entity));
    writeFile(join(srcDir, 'entities', `${name}.types.ts`), generateEntityType(entity));
    writeFile(join(srcDir, 'repositories', `${name}.repository.ts`), generateRepositoryImpl(entity));
    allFiles.push(`entities/${name}.schema.ts`, `entities/${name}.types.ts`);
    allFiles.push(`repositories/${name}.repository.ts`);
  }

  // ── Functions ─────────────────────────────────
  for (const fn of schema.functions) {
    const f = `functions/${fn.name}.function.ts`;
    writeFile(join(srcDir, f), generateFunction(fn));
    allFiles.push(f);
  }

  // ── Commands ──────────────────────────────────
  for (const cmd of schema.commands) {
    const f = `commands/${cmd.name}.command.ts`;
    writeFile(join(srcDir, f), generateCommand(cmd));
    allFiles.push(f);
  }

  // ── Routes ────────────────────────────────────
  for (const route of schema.routes) {
    const f = `routes/${route.name}.routes.ts`;
    writeFile(join(srcDir, f), generateRoute(route));
    allFiles.push(f);
  }

  // ── Providers ─────────────────────────────────
  for (const provider of schema.providers) {
    const f = `providers/${provider.name}.provider.ts`;
    writeFile(join(srcDir, f), generateProvider(provider));
    allFiles.push(f);
  }

  // ── Clients ───────────────────────────────────
  for (const client of schema.clients) {
    const f = `clients/${client.name}.client.ts`;
    writeFile(join(srcDir, f), generateClient(client));
    allFiles.push(f);
  }

  // ── Services ──────────────────────────────────
  for (const svc of schema.services) {
    const f = `services/${svc.name}.service.ts`;
    writeFile(join(srcDir, f), generateService(svc));
    allFiles.push(f);
  }

  // ── Middlewares ────────────────────────────────
  for (const mw of schema.middlewares) {
    const f = `middlewares/${mw.name}.middleware.ts`;
    writeFile(join(srcDir, f), generateMiddleware(mw));
    allFiles.push(f);
  }

  // ── Plugins ───────────────────────────────────
  for (const plugin of schema.plugins) {
    const f = `plugins/${plugin.name}.plugin.ts`;
    writeFile(join(srcDir, f), generatePlugin(plugin));
    allFiles.push(f);
  }

  // ── Events ────────────────────────────────────
  for (const event of schema.events) {
    const f = `events/${event.name}.event.ts`;
    writeFile(join(srcDir, f), generateEvent(event));
    allFiles.push(f);
  }

  // ── Workers ───────────────────────────────────
  for (const worker of schema.workers) {
    const f = `workers/${worker.name}.worker.ts`;
    writeFile(join(srcDir, f), generateWorker(worker));
    allFiles.push(f);
  }

  // ── Streams ───────────────────────────────────
  for (const stream of schema.streams) {
    const f = `streams/${stream.name}.stream.ts`;
    writeFile(join(srcDir, f), generateStream(stream));
    allFiles.push(f);
  }

  // ── Hooks ─────────────────────────────────────
  for (const hook of schema.hooks) {
    const f = `hooks/${hook.name}.hook.ts`;
    writeFile(join(srcDir, f), generateHook(hook));
    allFiles.push(f);
  }

  // ── Barrel ────────────────────────────────────
  writeFile(join(srcDir, 'index.ts'), generateBarrel(allFiles));

  // ── SQLite Migrations ─────────────────────────
  const migrationsDir = join(nodeDir, 'apps', 'api', 'migrations');
  // Clear old migrations to avoid duplicates on regeneration
  if (existsSync(migrationsDir)) {
    for (const f of readdirSync(migrationsDir)) {
      if (f.endsWith('.sql')) unlinkSync(join(migrationsDir, f));
    }
  }
  const migrations = generateAllCreateMigrations(schema.entities);
  for (const m of migrations) {
    writeFile(join(migrationsDir, m.filename), m.content);
  }

  // ── Watt App Infrastructure ───────────────────
  const wattFiles = generateAllWattFiles(schema, 'observability');
  for (const wf of wattFiles) {
    writeFile(join(nodeDir, wf.path), wf.content);
  }

  // ── Tests ─────────────────────────────────────
  for (const entity of schema.entities) {
    const name = entity.name.toLowerCase();
    writeFile(
      join(nodeDir, '__tests__', 'entities', `${name}.test.ts`),
      generateEntityTest(entity),
    );
  }
  for (const route of schema.routes) {
    writeFile(
      join(nodeDir, '__tests__', 'routes', `${route.name}.test.ts`),
      generateRouteTest(route),
    );
  }

  log.info({ files: allFiles.length, migrations: migrations.length }, 'Node.js generation complete');
};
