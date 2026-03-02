/**
 * Create-Table Migration Generator — produces initial SQL migrations from entities
 */

import type { EntityDef, EntityField } from '../../parsers/entity.parser.js';

const toSnake = (s: string): string =>
  s.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase().replace(/-/g, '_');

const toTableName = (entity: string): string => toSnake(entity) + 's';

const TS_TO_SQL: Record<string, string> = {
  string: 'TEXT',
  number: 'INTEGER',
  integer: 'INTEGER',
  float: 'REAL',
  boolean: 'INTEGER',
  date: 'TEXT',
  datetime: 'TEXT',
  timestamp: 'TEXT',
  json: 'TEXT',
  object: 'TEXT',
  array: 'TEXT',
  enum: 'TEXT',
  'string[]': 'TEXT',
};

const sqlType = (type: string): string => TS_TO_SQL[type] ?? 'TEXT';

const defaultClause = (field: EntityField): string => {
  if (field.default === undefined || field.default === null) return '';
  if (field.type === 'boolean') return ` DEFAULT ${field.default ? 1 : 0}`;
  if (typeof field.default === 'number') return ` DEFAULT ${field.default}`;
  return ` DEFAULT '${String(field.default)}'`;
};

export interface CreateMigration {
  filename: string;
  content: string;
}

export const generateCreateTableMigration = (
  entity: EntityDef,
  index: number,
): CreateMigration => {
  const table = toTableName(entity.name);
  const num = String(index).padStart(3, '0');

  // Filter out auto-added columns from entity fields
  const autoColumns = new Set(['id', 'createdAt', 'updatedAt', 'created_at', 'updated_at']);
  const cols = [
    'id TEXT PRIMARY KEY',
    ...entity.fields
      .filter((f) => !autoColumns.has(f.name))
      .map((f) => {
        const col = toSnake(f.name);
        const parts = [col, sqlType(f.type)];
        if (f.required !== false) parts.push('NOT NULL');
        if (f.unique) parts.push('UNIQUE');
        const def = defaultClause(f);
        if (def) parts.push(def.trim());
        return parts.join(' ');
      }),
    "created_at TEXT NOT NULL DEFAULT (datetime('now'))",
    "updated_at TEXT NOT NULL DEFAULT (datetime('now'))",
  ];

  const indexStatements: string[] = [];
  for (const f of entity.fields) {
    if (f.index) {
      const col = toSnake(f.name);
      indexStatements.push(`CREATE INDEX IF NOT EXISTS idx_${table}_${col} ON ${table} (${col});`);
    }
  }

  const content = [
    `-- Create ${table}`,
    `CREATE TABLE IF NOT EXISTS ${table} (`,
    `  ${cols.join(',\n  ')}`,
    `);`,
    '',
    ...indexStatements,
    '',
  ].join('\n');

  return {
    filename: `${num}-create-${table}.sql`,
    content,
  };
};

export const generateAllCreateMigrations = (
  entities: EntityDef[],
): CreateMigration[] => {
  return entities.map((entity, i) =>
    generateCreateTableMigration(entity, i + 1),
  );
};
