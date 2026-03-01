/**
 * Build Node.js target — generates TypeScript from YAML schemas
 */

import { join } from 'node:path';
import { parseAll, validate } from '../index.js';
import { generateEntitySchema, generateEntityType, generateEntityRepository } from '../generators/node/entity.gen.js';
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
  const nodeDir = join(generatedDir, 'node', 'src');
  const allFiles: string[] = [];

  for (const entity of schema.entities) {
    const dir = join(nodeDir, 'entities');
    const name = entity.name.toLowerCase();
    writeFile(join(dir, `${name}.schema.ts`), generateEntitySchema(entity));
    writeFile(join(dir, `${name}.types.ts`), generateEntityType(entity));
    writeFile(join(dir, `${name}.repository.ts`), generateEntityRepository(entity));
    allFiles.push(`entities/${name}.schema.ts`, `entities/${name}.types.ts`);
  }

  for (const fn of schema.functions) {
    const f = `functions/${fn.name}.function.ts`;
    writeFile(join(nodeDir, f), generateFunction(fn));
    allFiles.push(f);
  }

  for (const cmd of schema.commands) {
    const f = `commands/${cmd.name}.command.ts`;
    writeFile(join(nodeDir, f), generateCommand(cmd));
    allFiles.push(f);
  }

  for (const route of schema.routes) {
    const f = `routes/${route.name}.routes.ts`;
    writeFile(join(nodeDir, f), generateRoute(route));
    allFiles.push(f);
  }

  for (const provider of schema.providers) {
    const f = `providers/${provider.name}.provider.ts`;
    writeFile(join(nodeDir, f), generateProvider(provider));
    allFiles.push(f);
  }

  for (const client of schema.clients) {
    const f = `clients/${client.name}.client.ts`;
    writeFile(join(nodeDir, f), generateClient(client));
    allFiles.push(f);
  }

  for (const svc of schema.services) {
    const f = `services/${svc.name}.service.ts`;
    writeFile(join(nodeDir, f), generateService(svc));
    allFiles.push(f);
  }

  for (const mw of schema.middlewares) {
    const f = `middlewares/${mw.name}.middleware.ts`;
    writeFile(join(nodeDir, f), generateMiddleware(mw));
    allFiles.push(f);
  }

  for (const plugin of schema.plugins) {
    const f = `plugins/${plugin.name}.plugin.ts`;
    writeFile(join(nodeDir, f), generatePlugin(plugin));
    allFiles.push(f);
  }

  for (const event of schema.events) {
    const f = `events/${event.name}.event.ts`;
    writeFile(join(nodeDir, f), generateEvent(event));
    allFiles.push(f);
  }

  for (const worker of schema.workers) {
    const f = `workers/${worker.name}.worker.ts`;
    writeFile(join(nodeDir, f), generateWorker(worker));
    allFiles.push(f);
  }

  for (const stream of schema.streams) {
    const f = `streams/${stream.name}.stream.ts`;
    writeFile(join(nodeDir, f), generateStream(stream));
    allFiles.push(f);
  }

  for (const hook of schema.hooks) {
    const f = `hooks/${hook.name}.hook.ts`;
    writeFile(join(nodeDir, f), generateHook(hook));
    allFiles.push(f);
  }

  writeFile(join(nodeDir, 'index.ts'), generateBarrel(allFiles));
  log.info({ files: allFiles.length }, 'Node.js generation complete');
};
