/**
 * Watt Generator — orchestrates all code generation for a runnable Watt project
 *
 * Architecture (token-efficient):
 * - apps/db/         → Platformatic DB (auto CRUD + GraphQL + auth rules)
 * - apps/api/        → Custom routes + business logic (one plugin per feature)
 * - types/           → Shared TypeScript types
 * - tests/           → Integration tests
 *
 * From YAML → 100% runnable project. Zero manual code.
 */

import type { FeatureNode, FeatureEntity } from '../../ast/feature.js';
import {
  generateWattJson, generateDbConfig, generateApiServiceConfig,
  generateDbPackageJson, generateApiPackageJson,
  generateEnvTemplate, generateRootPackageJson,
  generateDockerfile, generateRenderYaml,
} from './config.gen.js';
import { generateFeatureMigrations } from './migration.gen.js';
import { generatePlugin, generateAuthPlugin, generateRouteHandler, generateFunction } from './plugin.gen.js';
import { generateClient } from './client.gen.js';
import { generateEntityType } from './types.gen.js';
import { generateEventBus, generateEventHandlers, generateWorker } from './event.gen.js';
import { generateAllTests } from './test.gen.js';
import { generateLogicFunction } from './logic.gen.js';
import { parseLogicBlock } from '../../parsers/logic.parser.js';

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
  const allEntities: FeatureEntity[] = [];

  // ── 1. Root configs ──
  files.push(generateWattJson(features));
  files.push(generateEnvTemplate(features));
  files.push(generateRootPackageJson());
  files.push(generateDockerfile());
  files.push(generateRenderYaml());

  // ── 2. DB app (shared database) ──
  const hasEntities = features.some((f) => f.entities.length > 0);
  if (hasEntities) {
    files.push(generateDbConfig(features));
    files.push(generateDbPackageJson());
  }

  // Migrations — global sequential numbering
  let migrationCounter = 1;
  for (const feature of features) {
    const migrations = generateFeatureMigrations(feature, migrationCounter);
    for (const m of migrations) {
      files.push({ path: `apps/db/migrations/${m.number}.do.sql`, content: m.doSql + '\n' });
      files.push({ path: `apps/db/migrations/${m.number}.undo.sql`, content: m.undoSql + '\n' });
    }
    migrationCounter += migrations.length;
  }

  // ── 3. API app (all custom logic) ──
  const hasCustomLogic = features.some(
    (f) => f.routes.length > 0 || f.functions.length > 0 || f.events.length > 0 || f.workers.length > 0
  );
  if (hasCustomLogic) {
    files.push(generateApiServiceConfig(features));
    files.push(generateApiPackageJson());

    // Auth plugin (JWT + API key)
    files.push({
      path: 'apps/api/plugins/auth.ts',
      content: generateAuthPlugin(features),
    });

    // One plugin per feature (routes → handlers)
    for (const feature of features) {
      const name = toKebab(feature.name);
      if (feature.routes.length > 0) {
        files.push({
          path: `apps/api/plugins/${name}.ts`,
          content: generatePlugin(feature),
        });
      }

      // Functions — logic-compiled or stubs
      const explicitFnNames = new Set(feature.functions.map((f) => toCamel(f.name)));
      for (const fn of feature.functions) {
        const fnName = toCamel(fn.name);
        if (fn.logic && Array.isArray(fn.logic) && fn.logic.length > 0) {
          const logicBlock = parseLogicBlock(fn.logic);
          const inputFields = (fn.input ?? []).map((i) => ({ name: i.name, type: i.type }));
          files.push({
            path: `apps/api/functions/${fnName}.ts`,
            content: generateLogicFunction(fnName, inputFields, logicBlock, name),
          });
        } else {
          files.push({
            path: `apps/api/functions/${fnName}.ts`,
            content: generateFunction(fn),
          });
        }
      }

      // Route handlers without explicit functions
      for (const route of feature.routes) {
        const handlerName = toCamel(route.name);
        if (!explicitFnNames.has(handlerName)) {
          files.push({
            path: `apps/api/functions/${handlerName}.ts`,
            content: generateRouteHandler(route),
          });
        }
      }

      // Events + Workers
      if (feature.events.length > 0) {
        files.push({
          path: `apps/api/plugins/${name}-events.ts`,
          content: generateEventBus(feature),
        });
        files.push({
          path: `apps/api/plugins/${name}-handlers.ts`,
          content: generateEventHandlers(feature),
        });
      }

      for (const worker of feature.workers) {
        files.push({
          path: `apps/api/workers/${toCamel(worker.name)}.ts`,
          content: generateWorker(worker, feature),
        });
      }

      // Clients
      for (const client of feature.clients) {
        files.push({
          path: `apps/api/clients/${toKebab(client.name)}.ts`,
          content: generateClient(client),
        });
      }
    }
  }

  // ── 4. Types (one file per entity + barrel) ──
  for (const feature of features) {
    for (const entity of feature.entities) {
      files.push({
        path: `types/${toPascal(entity.name)}.ts`,
        content: generateEntityType(entity),
      });
      allEntities.push(entity);
    }
  }
  if (allEntities.length > 0) {
    const exports = allEntities
      .map((e) => `export * from './${toPascal(e.name)}.js';`)
      .sort()
      .join('\n');
    files.push({ path: 'types/index.ts', content: exports + '\n' });
  }

  // ── 5. Tests ──
  for (const feature of features) {
    const tests = generateAllTests(feature);
    for (const t of tests) {
      files.push(t);
    }
  }

  // ── 6. .gitignore ──
  files.push({
    path: '.gitignore',
    content: 'node_modules/\ndist/\n*.sqlite\n.env\n',
  });

  return files;
};
