/**
 * Build docs target — generates a VitePress documentation site from YAML schemas
 */

import { join } from 'node:path';
import { parseAll } from '../index.js';
import { generateDocs } from '../generators/docs/index.gen.js';
import type { WriteFileFn } from './types.js';
import { createChildLogger } from '../logger.js';

const log = createChildLogger('build-docs');

export const buildDocs = (
  schemaDir: string,
  generatedDir: string,
  writeFile: WriteFileFn,
): void => {
  const schema = parseAll(schemaDir);
  const docsDir = join(generatedDir, 'docs');
  log.info({ entities: schema.entities.length, functions: schema.functions.length }, 'generating docs');
  generateDocs(schema, docsDir, writeFile);
  log.info({ docsDir }, 'docs generated');
};
