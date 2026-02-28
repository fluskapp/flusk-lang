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
import { generatePlugin, generateFunction, generateRouteHandler } from './plugin.gen.js';
import { generateLogicFunction } from './logic.gen.js';
import { parseLogicBlock } from '../../parsers/logic.parser.js';
import { generateClient } from './client.gen.js';
import { generateEntityType, generateFeatureTypes } from './types.gen.js';
import { generateEventBus, generateEventHandlers, generateWorker } from './event.gen.js';
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

  // Collect all entities for unified types/index.ts
  const allEntities: import('../../ast/feature.js').FeatureEntity[] = [];

  // 3. Per-feature generation
  let migrationCounter = 1;
  for (const feature of features) {
    const name = toKebab(feature.name);

    // Service config (if feature has custom logic)
    const hasCustomLogic = feature.routes.length > 0 || feature.functions.length > 0 || feature.events.length > 0 || feature.workers.length > 0;
    if (hasCustomLogic) {
      files.push(generateServiceConfig(feature));
    }

    // Migrations (global sequential numbering across all features)
    const migrations = generateFeatureMigrations(feature, migrationCounter);
    for (const m of migrations) {
      files.push({ path: `apps/db/migrations/${m.number}.do.sql`, content: m.doSql + '\n' });
      files.push({ path: `apps/db/migrations/${m.number}.undo.sql`, content: m.undoSql + '\n' });
    }
    migrationCounter += migrations.length;

    // Plugin (custom routes)
    if (feature.routes.length > 0) {
      files.push({
        path: `apps/${name}/plugins/${name}.ts`,
        content: generatePlugin(feature),
      });
    }

    // Functions (explicit business logic)
    const explicitFnNames = new Set(feature.functions.map((f) => toCamel(f.name)));
    for (const fn of feature.functions) {
      // If function has logic DSL, use the logic compiler
      if (fn.logic && Array.isArray(fn.logic) && fn.logic.length > 0) {
        const logicBlock = parseLogicBlock(fn.logic);
        const inputFields = (fn.input ?? []).map((i) => ({ name: i.name, type: i.type }));
        files.push({
          path: `apps/${name}/functions/${toCamel(fn.name)}.ts`,
          content: generateLogicFunction(toCamel(fn.name), inputFields, logicBlock, name),
        });
      } else {
        files.push({
          path: `apps/${name}/functions/${toCamel(fn.name)}.ts`,
          content: generateFunction(fn),
        });
      }
    }

    // Auto-generated route handlers (for routes without explicit functions)
    for (const route of feature.routes) {
      const handlerName = toCamel(route.name);
      if (!explicitFnNames.has(handlerName)) {
        files.push({
          path: `apps/${name}/functions/${handlerName}.ts`,
          content: generateRouteHandler(route),
        });
      }
    }

    // Events + Workers
    if (feature.events.length > 0) {
      files.push({
        path: `apps/${name}/plugins/event-bus.ts`,
        content: generateEventBus(feature),
      });
      files.push({
        path: `apps/${name}/plugins/event-handlers.ts`,
        content: generateEventHandlers(feature),
      });
    }

    for (const worker of feature.workers) {
      files.push({
        path: `apps/${name}/workers/${toCamel(worker.name)}.ts`,
        content: generateWorker(worker, feature),
      });
    }

    // Clients (external APIs)
    for (const client of feature.clients) {
      files.push({
        path: `apps/${name}/clients/${toKebab(client.name)}.ts`,
        content: generateClient(client),
      });
    }

    // Types (individual files per entity)
    for (const entity of feature.entities) {
      files.push({
        path: `types/${toPascal(entity.name)}.ts`,
        content: generateEntityType(entity),
      });
      allEntities.push(entity);
    }

    // Tests
    const tests = generateAllTests(feature);
    for (const t of tests) {
      files.push(t);
    }
  }

  // 4. Unified types/index.ts (all entities from all features)
  if (allEntities.length > 0) {
    const exports = allEntities
      .map((e) => `export * from './${toPascal(e.name)}.js';`)
      .sort()
      .join('\n');
    files.push({ path: 'types/index.ts', content: exports + '\n' });
  }

  return files;
};
