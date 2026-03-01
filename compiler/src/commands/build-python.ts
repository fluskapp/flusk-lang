/**
 * Build Python target — generates Python from YAML schemas
 */

import { join } from 'node:path';
import { parseAll, validate } from '../index.js';
import { generatePythonEntity } from '../generators/python/entity.gen.js';
import { generatePythonFunction } from '../generators/python/function.gen.js';
import type { WriteFileFn } from './types.js';
import { createChildLogger } from '../logger.js';

const log = createChildLogger('build-python');

export const buildPython = (
  schemaDir: string,
  generatedDir: string,
  skipRefs: boolean,
  writeFile: WriteFileFn,
): void => {
  const schema = skipRefs ? parseAll(schemaDir) : validate(schemaDir);
  const pyDir = join(generatedDir, 'python');

  for (const entity of schema.entities) {
    writeFile(join(pyDir, 'entities', `${entity.name.toLowerCase()}.py`), generatePythonEntity(entity));
  }

  for (const fn of schema.functions) {
    writeFile(join(pyDir, 'functions', `${fn.name}.py`), generatePythonFunction(fn));
  }

  log.info('Python generation complete');
};
