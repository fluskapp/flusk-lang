import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseEntity, type EntityDef } from './parsers/entity.parser.js';
import { parseFunction, type FunctionDef } from './parsers/function.parser.js';
import { parseCommand, type CommandDef } from './parsers/command.parser.js';
import { parseRoute, type RouteDef } from './parsers/route.parser.js';
import { parseProvider, type ProviderDef } from './parsers/provider.parser.js';
import { parseClient, type ClientDef } from './parsers/client.parser.js';
import { parseService, type ServiceDef } from './parsers/service.parser.js';
import { parseMiddleware, type MiddlewareDef } from './parsers/middleware.parser.js';
import { parsePlugin, type PluginDef } from './parsers/plugin.parser.js';
import { parseEvent, type EventDef } from './parsers/event.parser.js';
import { parseWorker, type WorkerDef } from './parsers/worker.parser.js';
import { parseStream, type StreamDef } from './parsers/stream.parser.js';
import { validateRefs } from './validators/refs.validator.js';
import { lintGeneratedCode, type LintResult, type LintIssue } from './validators/lint.validator.js';

export { lintGeneratedCode, type LintResult, type LintIssue };

export type { EntityDef, FunctionDef, CommandDef, RouteDef, ProviderDef, ClientDef, ServiceDef, MiddlewareDef, PluginDef, EventDef, WorkerDef, StreamDef };

export interface ParsedSchema {
  entities: EntityDef[];
  functions: FunctionDef[];
  commands: CommandDef[];
  routes: RouteDef[];
  providers: ProviderDef[];
  clients: ClientDef[];
  services: ServiceDef[];
  middlewares: MiddlewareDef[];
  plugins: PluginDef[];
  events: EventDef[];
  workers: WorkerDef[];
  streams: StreamDef[];
}

const loadDir = <T>(dir: string, parser: (f: string) => T): T[] => {
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
      .map((f) => parser(join(dir, f)));
  } catch {
    return [];
  }
};

export const parseAll = (schemaDir: string): ParsedSchema => {
  const schema: ParsedSchema = {
    entities: loadDir(join(schemaDir, 'entities'), parseEntity),
    functions: loadDir(join(schemaDir, 'functions'), parseFunction),
    commands: loadDir(join(schemaDir, 'commands'), parseCommand),
    routes: loadDir(join(schemaDir, 'routes'), parseRoute),
    providers: loadDir(join(schemaDir, 'providers'), parseProvider),
    clients: loadDir(join(schemaDir, 'clients'), parseClient),
    services: loadDir(join(schemaDir, 'services'), parseService),
    middlewares: loadDir(join(schemaDir, 'middlewares'), parseMiddleware),
    plugins: loadDir(join(schemaDir, 'plugins'), parsePlugin),
    events: loadDir(join(schemaDir, 'events'), parseEvent),
    workers: loadDir(join(schemaDir, 'workers'), parseWorker),
    streams: loadDir(join(schemaDir, 'streams'), parseStream),
  };
  return schema;
};

export const validate = (schemaDir: string): ParsedSchema => {
  const schema = parseAll(schemaDir);
  validateRefs(schema);
  return schema;
};
