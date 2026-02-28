/**
 * Watt Migration Generator — SQL migrations compatible with @platformatic/db
 * Platformatic uses simple .sql files in a migrations/ directory
 * Files named: 001.do.sql (up), 001.undo.sql (down)
 */

import type { FeatureNode, FeatureEntity, FeatureField } from '../../ast/feature.js';
import type { Changeset, FieldChange } from '../../exploder/diff.js';

const toSnake = (s: string): string =>
  s.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase().replace(/-/g, '_');

const toTableName = (entity: string): string => toSnake(entity) + 's';

const TS_TO_SQL: Record<string, string> = {
  string: 'TEXT', number: 'INTEGER', boolean: 'INTEGER',
  date: 'TEXT', datetime: 'TEXT', json: 'TEXT',
  float: 'REAL', enum: 'TEXT', 'string[]': 'TEXT',
};

const sqlType = (type: string): string => TS_TO_SQL[type] ?? 'TEXT';

const defaultClause = (value: unknown, type: string): string => {
  if (value === undefined || value === null) return '';
  if (type === 'boolean') return ` DEFAULT ${value ? 1 : 0}`;
  if (typeof value === 'number') return ` DEFAULT ${value}`;
  return ` DEFAULT '${String(value)}'`;
};

export interface WattMigration {
  number: string;
  doSql: string;
  undoSql: string;
}

/** Generate CREATE TABLE migration for a new entity */
export const generateCreateTable = (entity: FeatureEntity, num: string): WattMigration => {
  const table = toTableName(entity.name);
  const cols = [
    'id INTEGER PRIMARY KEY AUTOINCREMENT',
    ...entity.fields.map((f) => {
      const col = toSnake(f.name);
      const parts = [col, sqlType(f.type)];
      if (f.unique) parts.push('UNIQUE');
      if (f.required) parts.push('NOT NULL');
      const def = defaultClause(f.default, f.type).trim();
      if (def) parts.push(def);
      return parts.join(' ');
    }),
    "created_at TEXT NOT NULL DEFAULT (datetime('now'))",
    "updated_at TEXT NOT NULL DEFAULT (datetime('now'))",
  ];

  // Indexes
  const indexes: string[] = [];
  for (const f of entity.fields) {
    if (f.indexed || f.unique) {
      const col = toSnake(f.name);
      const unique = f.unique ? 'UNIQUE ' : '';
      indexes.push(`CREATE ${unique}INDEX IF NOT EXISTS idx_${table}_${col} ON ${table} (${col});`);
    }
  }

  const doSql = [
    `CREATE TABLE IF NOT EXISTS ${table} (`,
    cols.map((c) => `  ${c}`).join(',\n'),
    ');',
    ...indexes,
  ].join('\n');

  const undoSql = `DROP TABLE IF EXISTS ${table};`;

  return { number: num, doSql, undoSql };
};

/** Generate ALTER TABLE migrations from field changes */
export const generateAlterTable = (changes: FieldChange[], num: string): WattMigration[] => {
  const byEntity = new Map<string, FieldChange[]>();
  for (const c of changes) {
    const list = byEntity.get(c.entity) ?? [];
    list.push(c);
    byEntity.set(c.entity, list);
  }

  const migrations: WattMigration[] = [];
  let idx = 0;

  for (const [entity, fieldChanges] of byEntity) {
    const table = toTableName(entity);
    const ups: string[] = [];
    const downs: string[] = [];

    for (const fc of fieldChanges) {
      const col = toSnake(fc.field);
      if (fc.kind === 'added') {
        const f = fc.newValue as FeatureField;
        const notNull = f.required ? ' NOT NULL' : '';
        const def = defaultClause(f.default, f.type);
        ups.push(`ALTER TABLE ${table} ADD COLUMN ${col} ${sqlType(f.type)}${notNull}${def};`);
        downs.push(`ALTER TABLE ${table} DROP COLUMN ${col};`);
      } else if (fc.kind === 'removed') {
        const f = fc.oldValue as FeatureField;
        ups.push(`ALTER TABLE ${table} DROP COLUMN ${col};`);
        downs.push(`ALTER TABLE ${table} ADD COLUMN ${col} ${sqlType(f.type)};`);
      }
    }

    if (ups.length > 0) {
      const n = String(parseInt(num) + idx).padStart(3, '0');
      migrations.push({ number: n, doSql: ups.join('\n'), undoSql: downs.join('\n') });
      idx++;
    }
  }

  return migrations;
};

/** Generate all migrations for a feature (initial setup) */
export const generateFeatureMigrations = (feature: FeatureNode, startNum = 1): WattMigration[] => {
  const migrations: WattMigration[] = [];
  let num = startNum;

  for (const entity of feature.entities) {
    migrations.push(generateCreateTable(entity, String(num).padStart(3, '0')));
    num++;
  }

  return migrations;
};
