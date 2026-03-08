/**
 * Build React views from view YAML schemas
 */

import { join, dirname } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { buildViews } from '../pipeline.js';
import { createChildLogger } from '../logger.js';

const log = createChildLogger('build-views');

export const buildReactViews = (
  schemaDir: string,
  generatedDir: string,
  standalone?: boolean,
): void => {
  const viewsDir = join(schemaDir, 'views');
  const widgetsDir = join(schemaDir, 'widgets');
  const partialsDir = join(schemaDir, 'partials');
  const outDir = join(generatedDir, 'views');

  const result = buildViews(viewsDir, widgetsDir, partialsDir, { standalone });

  for (const d of result.diagnostics) {
    if (d.severity === 'error') log.error({ code: d.code, file: d.file, line: d.line }, d.message);
    else if (d.severity === 'warning') log.warn({ code: d.code, file: d.file, line: d.line }, d.message);
    else log.info({ code: d.code, file: d.file, line: d.line }, d.message);
  }

  const errors = result.diagnostics.filter((d) => d.severity === 'error');
  if (errors.length > 0) {
    log.error({ count: errors.length }, 'errors found');
    process.exit(1);
  }

  for (const file of result.files) {
    const fullPath = join(outDir, file.path);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, file.content, 'utf-8');
    log.debug({ path: fullPath }, 'wrote file');
  }

  log.info({ files: result.files.length, pages: result.pages.length }, 'views generation complete');
};
