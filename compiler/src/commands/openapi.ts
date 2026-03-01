import { join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { parseAll } from '../index.js';
import type { EntityDef } from '../parsers/entity.parser.js';
import type { RouteDef } from '../parsers/route.parser.js';
import { createChildLogger } from '../logger.js';

const log = createChildLogger('openapi');

interface OpenApiSpec {
  openapi: string;
  info: { title: string; version: string };
  paths: Record<string, Record<string, unknown>>;
  components: { schemas: Record<string, unknown> };
}

const mapFieldType = (type: string): Record<string, unknown> => {
  const arrayMatch = type.match(/^(.+)\[\]$/);
  if (arrayMatch) {
    return { type: 'array', items: mapFieldType(arrayMatch[1]!) };
  }
  switch (type) {
    case 'string': case 'uuid': case 'email': case 'url':
    case 'datetime': case 'date': case 'text':
      return { type: 'string' };
    case 'integer': case 'int':
      return { type: 'integer' };
    case 'number': case 'float': case 'decimal':
      return { type: 'number' };
    case 'boolean':
      return { type: 'boolean' };
    case 'json': case 'object': case 'record':
      return { type: 'object' };
    default:
      return { $ref: `#/components/schemas/${type}` };
  }
};

const buildEntitySchema = (entity: EntityDef): Record<string, unknown> => {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  for (const field of entity.fields) {
    properties[field.name] = mapFieldType(field.type);
    if (field.description) {
      (properties[field.name] as Record<string, unknown>).description = field.description;
    }
    if (field.values) {
      (properties[field.name] as Record<string, unknown>).enum = field.values;
    }
    if (field.required !== false) required.push(field.name);
  }
  const schema: Record<string, unknown> = { type: 'object', properties };
  if (required.length > 0) schema.required = required;
  if (entity.description) schema.description = entity.description;
  return schema;
};

const buildPaths = (routes: RouteDef[]): Record<string, Record<string, unknown>> => {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const route of routes) {
    for (const op of route.operations) {
      const fullPath = `${route.basePath}${op.path || ''}`;
      const method = op.method.toLowerCase();
      if (!paths[fullPath]) paths[fullPath] = {};
      const operation: Record<string, unknown> = {
        operationId: op.call,
        tags: [route.name],
      };
      if (op.description) operation.summary = op.description;
      if (route.entity) {
        operation.responses = {
          '200': {
            description: 'Successful response',
            content: { 'application/json': { schema: { $ref: `#/components/schemas/${route.entity}` } } },
          },
        };
      } else {
        operation.responses = { '200': { description: 'Successful response' } };
      }
      if (['post', 'put', 'patch'].includes(method) && route.entity) {
        operation.requestBody = {
          content: { 'application/json': { schema: { $ref: `#/components/schemas/${route.entity}` } } },
        };
      }
      paths[fullPath]![method] = operation;
      log.debug({ fullPath, method, operationId: op.call }, 'added path');
    }
  }
  return paths;
};

export const generateOpenApi = (schemaDir: string, generatedDir: string): string => {
  const schema = parseAll(schemaDir);
  const spec: OpenApiSpec = {
    openapi: '3.1.0',
    info: { title: 'Flusk API', version: '0.1.0' },
    paths: buildPaths(schema.routes),
    components: {
      schemas: Object.fromEntries(
        schema.entities.map((e) => [e.name, buildEntitySchema(e)])
      ),
    },
  };
  const outputPath = join(generatedDir, 'openapi.yaml');
  mkdirSync(generatedDir, { recursive: true });
  writeFileSync(outputPath, yaml.dump(spec, { lineWidth: 120 }), 'utf-8');
  log.info({ entities: schema.entities.length, routes: schema.routes.length }, 'spec generated');
  return outputPath;
};
