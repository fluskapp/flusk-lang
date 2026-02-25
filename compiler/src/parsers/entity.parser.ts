import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { validateSchema } from '../validators/schema.validator.js';
import { entitySchema } from '../schemas/entity.schema.js';

export interface EntityField {
  name: string;
  type: string;
  required?: boolean;
  unique?: boolean;
  index?: boolean;
  default?: unknown;
  description?: string;
  values?: string[];
}

export interface EntityRelation {
  entity: string;
  type: string;
  foreignKey: string;
}

export interface EntityDef {
  name: string;
  description?: string;
  storage?: string;
  fields: EntityField[];
  capabilities?: Record<string, boolean> | string[];
  relations?: EntityRelation[];
  queries?: Array<{ name: string; sql: string }>;
}

/** Normalize fields from object-format to array-format */
const normalizeFields = (fields: unknown): EntityField[] => {
  if (Array.isArray(fields)) return fields as EntityField[];
  if (typeof fields === 'object' && fields !== null) {
    return Object.entries(fields).map(([name, def]) => ({
      name,
      ...(typeof def === 'object' && def !== null ? def : { type: 'string' }),
    })) as EntityField[];
  }
  return [];
};

export const parseEntity = (filePath: string): EntityDef => {
  const content = readFileSync(filePath, 'utf-8');
  const data = yaml.load(content) as Record<string, unknown>;
  validateSchema(data, entitySchema, filePath);
  return {
    ...data,
    fields: normalizeFields(data.fields),
  } as EntityDef;
};
