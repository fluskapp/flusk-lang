import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseEntity, type EntityDef } from './parsers/entity.parser.js';
import { parseFunction, type FunctionDef } from './parsers/function.parser.js';
import { parseCommand, type CommandDef } from './parsers/command.parser.js';
import { parseRoute, type RouteDef } from './parsers/route.parser.js';
import { parseProvider, type ProviderDef } from './parsers/provider.parser.js';
import { parseClient, type ClientDef } from './parsers/client.parser.js';
import { validateRefs } from './validators/refs.validator.js';

export type { EntityDef, FunctionDef, CommandDef, RouteDef, ProviderDef, ClientDef };

export interface ParsedSchema {
  entities: EntityDef[];
  functions: FunctionDef[];
  commands: CommandDef[];
  routes: RouteDef[];
  providers: ProviderDef[];
  clients: ClientDef[];
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
  };
  return schema;
};

export const validate = (schemaDir: string): ParsedSchema => {
  const schema = parseAll(schemaDir);
  validateRefs(schema);
  return schema;
};
