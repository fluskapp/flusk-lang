/**
 * Build React views from view YAML schemas
 */

import { join, dirname } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { buildViews } from '../pipeline.js';

export const buildReactViews = (
  schemaDir: string,
  generatedDir: string,
): void => {
  const viewsDir = join(schemaDir, 'views');
  const widgetsDir = join(schemaDir, 'widgets');
  const partialsDir = join(schemaDir, 'partials');
  const outDir = join(generatedDir, 'views');

  const result = buildViews(viewsDir, widgetsDir, partialsDir);

  for (const d of result.diagnostics) {
    const icon = d.severity === 'error' ? '❌' : d.severity === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`  ${icon} ${d.code}: ${d.message} (${d.file}:${d.line})`);
  }

  const errors = result.diagnostics.filter((d) => d.severity === 'error');
  if (errors.length > 0) {
    console.error(`\n❌ ${errors.length} error(s) found`);
    process.exit(1);
  }

  for (const file of result.files) {
    const fullPath = join(outDir, file.path);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, file.content, 'utf-8');
    console.log(`  wrote ${fullPath}`);
  }

  console.log(`\n✅ Generated ${result.files.length} files from ${result.pages.length} views`);
};
