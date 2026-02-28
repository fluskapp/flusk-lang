/**
 * Migration Generator — produces SQL migrations from entity field changes
 * Works with the Diff Engine's FieldChange and Changeset types
 */

import yaml from 'js-yaml';
import type { FieldChange, Changeset } from '../../exploder/diff.js';

export interface Migration {
  name: string;
  timestamp: string;
  up: string;
  down: string;
}

const TS_TO_SQL: Record<string, string> = {
  string: 'TEXT',
  number: 'INTEGER',
  boolean: 'INTEGER',
  date: 'TEXT',
  datetime: 'TEXT',
  json: 'TEXT',
  float: 'REAL',
  enum: 'TEXT',
  'string[]': 'TEXT',
};

const toSnake = (s: string): string =>
  s.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase().replace(/-/g, '_');

const toTableName = (entity: string): string => toSnake(entity) + 's';

const sqlType = (type: string): string => TS_TO_SQL[type] ?? 'TEXT';

const defaultClause = (value: unknown, type: string): string => {
  if (value === undefined || value === null) return '';
  if (type === 'boolean') return ` DEFAULT ${value ? 1 : 0}`;
  if (typeof value === 'number') return ` DEFAULT ${value}`;
  return ` DEFAULT '${String(value)}'`;
};

// ── Generate from field changes ────────────────

export const generateFieldMigrations = (changes: FieldChange[]): Migration[] => {
  const migrations: Migration[] = [];
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

  // Group by entity
  const byEntity = new Map<string, FieldChange[]>();
  for (const change of changes) {
    const list = byEntity.get(change.entity) ?? [];
    list.push(change);
    byEntity.set(change.entity, list);
  }

  for (const [entity, fieldChanges] of byEntity) {
    const table = toTableName(entity);
    const ups: string[] = [];
    const downs: string[] = [];

    for (const fc of fieldChanges) {
      const col = toSnake(fc.field);

      switch (fc.kind) {
        case 'added': {
          const field = fc.newValue as { type: string; default?: unknown; required?: boolean };
          const notNull = field.required ? ' NOT NULL' : '';
          const def = defaultClause(field.default, field.type);
          ups.push(`ALTER TABLE ${table} ADD COLUMN ${col} ${sqlType(field.type)}${notNull}${def};`);
          downs.push(`ALTER TABLE ${table} DROP COLUMN ${col};`);
          break;
        }
        case 'removed': {
          const field = fc.oldValue as { type: string; default?: unknown; required?: boolean };
          const notNull = field.required ? ' NOT NULL' : '';
          const def = defaultClause(field.default, field.type);
          ups.push(`ALTER TABLE ${table} DROP COLUMN ${col};`);
          downs.push(`ALTER TABLE ${table} ADD COLUMN ${col} ${sqlType(field.type)}${notNull}${def};`);
          break;
        }
        case 'type-changed': {
          // SQLite doesn't support ALTER COLUMN, need recreate
          ups.push(`-- SQLite: type change ${col} from ${String(fc.oldValue)} to ${String(fc.newValue)}`);
          ups.push(`-- Requires table recreation (handled by migration runner)`);
          ups.push(`ALTER TABLE ${table} RENAME COLUMN ${col} TO ${col}_old;`);
          ups.push(`ALTER TABLE ${table} ADD COLUMN ${col} ${sqlType(String(fc.newValue))};`);
          ups.push(`UPDATE ${table} SET ${col} = CAST(${col}_old AS ${sqlType(String(fc.newValue))});`);
          ups.push(`ALTER TABLE ${table} DROP COLUMN ${col}_old;`);
          downs.push(`ALTER TABLE ${table} RENAME COLUMN ${col} TO ${col}_new;`);
          downs.push(`ALTER TABLE ${table} ADD COLUMN ${col} ${sqlType(String(fc.oldValue))};`);
          downs.push(`UPDATE ${table} SET ${col} = CAST(${col}_new AS ${sqlType(String(fc.oldValue))});`);
          downs.push(`ALTER TABLE ${table} DROP COLUMN ${col}_new;`);
          break;
        }
        case 'constraint-changed': {
          ups.push(`-- Constraint change on ${table}.${col}: ${JSON.stringify(fc.oldValue)} → ${JSON.stringify(fc.newValue)}`);
          // SQLite doesn't support ALTER CONSTRAINT; document only
          break;
        }
        case 'default-changed': {
          ups.push(`-- Default change on ${table}.${col}: ${String(fc.oldValue)} → ${String(fc.newValue)}`);
          break;
        }
      }
    }

    if (ups.length > 0) {
      migrations.push({
        name: `alter_${table}`,
        timestamp,
        up: ups.join('\n'),
        down: downs.join('\n'),
      });
    }
  }

  return migrations;
};

// ── Generate from full changeset ───────────────

export const generateMigrations = (changeset: Changeset): Migration[] => {
  const migrations: Migration[] = [];
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

  // New entities = CREATE TABLE
  for (const file of changeset.files) {
    if (file.type === 'entity' && file.kind === 'added' && file.newContent) {
      const data = yaml.load(file.newContent) as { name: string; fields: Array<{ name: string; type: string; required?: boolean; unique?: boolean; default?: unknown }> };

      const table = toTableName(data.name);
      const cols = [
        'id TEXT PRIMARY KEY',
        ...data.fields.map((f) => {
          const col = toSnake(f.name);
          const parts = [col, sqlType(f.type)];
          if (f.required) parts.push('NOT NULL');
          if (f.unique) parts.push('UNIQUE');
          parts.push(defaultClause(f.default, f.type).trim());
          return parts.filter(Boolean).join(' ');
        }),
        'created_at TEXT NOT NULL DEFAULT (datetime(\'now\'))',
        'updated_at TEXT NOT NULL DEFAULT (datetime(\'now\'))',
      ];

      migrations.push({
        name: `create_${table}`,
        timestamp,
        up: `CREATE TABLE IF NOT EXISTS ${table} (\n  ${cols.join(',\n  ')}\n);`,
        down: `DROP TABLE IF EXISTS ${table};`,
      });
    }
  }

  // Field changes on existing entities
  migrations.push(...generateFieldMigrations(changeset.fields));

  return migrations;
};
