import yaml from 'js-yaml';
import type { FeatureNode } from '../ast/feature.js';
import type { ExplodedFile } from './types.js';
import { toKebab, toPascal } from '../utils/naming.js';

const dump = (obj: unknown): string =>
  yaml.dump(obj, { lineWidth: 120, noRefs: true, quotingType: '"' });

export const explodeEntity = (entity: FeatureNode['entities'][0], feature: string): ExplodedFile => {
  const name = toPascal(entity.name);
  const fields = entity.fields.map((f) => {
    const field: Record<string, unknown> = { name: f.name, type: f.type };
    if (f.required) field.required = true;
    if (f.unique) field.unique = true;
    if (f.indexed) field.index = true;
    if (f.encrypted) field.description = `encrypted: ${f.description ?? f.name}`;
    if (f.nullable) field.required = false;
    if (f.default !== undefined) field.default = f.default;
    if (f.values) field.values = f.values;
    if (f.description) field.description = f.description;
    return field;
  });

  const queries = entity.queries?.map((q) => {
    if (q.by) return { name: q.name, sql: `SELECT * FROM ${toKebab(entity.name)} WHERE ${q.by} = ?` };
    if (q.where) {
      let sql = `SELECT * FROM ${toKebab(entity.name)} WHERE ${q.where}`;
      if (q.order) sql += ` ORDER BY ${q.order}`;
      if (q.limit) sql += ` LIMIT ${q.limit}`;
      return { name: q.name, sql };
    }
    return { name: q.name, sql: `SELECT * FROM ${toKebab(entity.name)}` };
  });

  const obj: Record<string, unknown> = { name, description: entity.description, fields };
  if (queries?.length) obj.queries = queries;
  if (entity.relations?.length) {
    obj.relations = entity.relations.map((r) => ({
      entity: toPascal(r.entity), type: r.type, foreignKey: r.foreignKey ?? `${toKebab(r.entity)}_id`,
    }));
  }
  if (entity.capabilities?.length) obj.capabilities = entity.capabilities;

  return {
    path: `entities/${toKebab(entity.name)}.entity.yaml`,
    content: dump(obj),
    type: 'entity',
  };
};
