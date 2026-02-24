import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { validateSchema } from '../validators/schema.validator.js';
import { entitySchema } from '../schemas/entity.schema.js';

export interface EntityField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'enum' | 'json' | 'date';
  required?: boolean;
  unique?: boolean;
  default?: unknown;
  description?: string;
  values?: string[];
}

export interface EntityDef {
  name: string;
  description?: string;
  storage?: 'postgres' | 'mongo' | 'memory';
  fields: EntityField[];
  capabilities?: string[];
}

export const parseEntity = (filePath: string): EntityDef => {
  const content = readFileSync(filePath, 'utf-8');
  const data = yaml.load(content) as EntityDef;
  validateSchema(data, entitySchema, filePath);
  return data;
};
