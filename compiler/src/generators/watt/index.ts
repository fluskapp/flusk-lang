/**
 * Watt Generator — orchestrates all Watt-targeted code generation
 *
 * From a FeatureNode, generates:
 * - watt.json (root config)
 * - apps/db/platformatic.json (DB config)
 * - apps/db/migrations/*.sql (Platformatic-compatible)
 * - apps/{feature}/platformatic.json (service config)
 * - apps/{feature}/plugins/*.ts (custom Fastify plugins)
 * - apps/{feature}/functions/*.ts (business logic)
 * - apps/{feature}/clients/*.ts (external API clients)
 * - types/*.ts (shared TypeScript types)
 * - tests/*.test.ts (integration tests)
 */

import type { FeatureNode } from '../../ast/feature.js';
import { generateWattJson, generateDbConfig, generateServiceConfig, generateEnvTemplate } from './config.gen.js';
import { generateFeatureMigrations } from './migration.gen.js';
import { generatePlugin, generateFunction } from './plugin.gen.js';
import { generateClient } from './client.gen.js';
import { generateEntityType, generateFeatureTypes } from './types.gen.js';
import { generateAllTests } from './test.gen.js';

export interface GeneratedFile {
  path: string;
  content: string;
}

const toPascal = (s: string): string =>
  s.split(/[-_ ]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');

const toCamel = (s: string): string => {
  const p = toPascal(s);
  return p.charAt(0).toLowerCase() + p.slice(1);
};

const toKebab = (s: string): string =>
  s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase().replace(/[_ ]+/g, '-');

export const generateWattProject = (features: FeatureNode[]): GeneratedFile[] => {
  const files: GeneratedFile[] = [];

  // 1. Root configs
  const wattJson = generateWattJson(features);
  files.push(wattJson);
  files.push(generateEnvTemplate(features));

  // 2. DB app (if any entities exist)
  const hasEntities = features.some((f) => f.entities.length > 0);
  if (hasEntities) {
    files.push(generateDbConfig(features));
  }

  // 3. Per-feature generation
  for (const feature of features) {
    const name = toKebab(feature.name);

    // Service config (only if feature has custom routes/functions)
    if (feature.routes.length > 0 || feature.functions.length > 0) {
      files.push(generateServiceConfig(feature));
    }

    // Migrations
    const migrations = generateFeatureMigrations(feature);
    for (const m of migrations) {
      files.push({ path: `apps/db/migrations/${m.number}.do.sql`, content: m.doSql + '\n' });
      files.push({ path: `apps/db/migrations/${m.number}.undo.sql`, content: m.undoSql + '\n' });
    }

    // Plugin (custom routes)
    if (feature.routes.length > 0) {
      files.push({
        path: `apps/${name}/plugins/${name}.ts`,
        content: generatePlugin(feature),
      });
    }

    // Functions (business logic)
    for (const fn of feature.functions) {
      files.push({
        path: `apps/${name}/functions/${toCamel(fn.name)}.ts`,
        content: generateFunction(fn),
      });
    }

    // Clients (external APIs)
    for (const client of feature.clients) {
      files.push({
        path: `apps/${name}/clients/${toKebab(client.name)}.ts`,
        content: generateClient(client),
      });
    }

    // Types
    for (const entity of feature.entities) {
      files.push({
        path: `types/${toPascal(entity.name)}.ts`,
        content: generateEntityType(entity),
      });
    }
    if (feature.entities.length > 0) {
      files.push({
        path: `types/index.ts`,
        content: generateFeatureTypes(feature),
      });
    }

    // Tests
    const tests = generateAllTests(feature);
    for (const t of tests) {
      files.push(t);
    }
  }

  return files;
};
