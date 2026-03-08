/**
 * Build SaaS target — generates Vite SPA frontend + Platformatic backend
 * from FluskSchema YAML files
 */

import { join } from 'node:path';
import { loadSaasSchemas } from '../parsers/saas-schema.parser.js';
import { TypeGenerator } from '../generators/saas/type.gen.js';
import { APIClientGenerator } from '../generators/saas/api-client.gen.js';
import { FormGenerator } from '../generators/saas/form.gen.js';
import { RouterGenerator } from '../generators/saas/router.gen.js';
import { VitePageGenerator } from '../generators/saas/vite-page.gen.js';
import { PlatformaticGenerator } from '../generators/saas/platformatic.gen.js';
import { createChildLogger } from '../logger.js';

const log = createChildLogger('build-saas');

export async function buildSaas(schemaDir: string, outputDir: string): Promise<void> {
  log.info({ schemaDir, outputDir }, 'loading saas schemas');

  const schemas = await loadSaasSchemas(schemaDir);

  if (schemas.length === 0) {
    log.warn('no saas schemas found');
    return;
  }

  log.info({ count: schemas.length }, 'schemas loaded');

  const generators = [
    { name: 'types',       gen: new TypeGenerator() },
    { name: 'pages',       gen: new VitePageGenerator() },
    { name: 'api-client',  gen: new APIClientGenerator() },
    { name: 'forms',       gen: new FormGenerator() },
    { name: 'router',      gen: new RouterGenerator() },
    { name: 'backend',     gen: new PlatformaticGenerator() },
  ];

  let totalFiles = 0;

  for (const { name, gen } of generators) {
    log.info({ generator: name }, 'generating');
    try {
      const result = await gen.generate(schemas, outputDir);
      totalFiles += result.filesGenerated;
      for (const w of result.warnings) log.warn({ generator: name }, w);
      for (const e of result.errors) log.error({ generator: name }, e);
    } catch (err) {
      log.error({ generator: name, err }, 'generator failed');
    }
  }

  log.info({ totalFiles, outputDir }, 'saas build complete');
}
