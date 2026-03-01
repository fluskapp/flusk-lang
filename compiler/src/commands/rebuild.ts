/**
 * Rebuild all targets from schema directory.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { validate } from '../index.js';
import { buildNode } from './build-node.js';
import { buildPython } from './build-python.js';
import { buildReactViews } from './build-views.js';
import { buildFeatures } from './features.js';

const writeFile = (path: string, content: string): void => {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, content, 'utf-8');
};

export const rebuildAll = (
  schemaDir: string,
  generatedDir: string
): void => {
  validate(schemaDir);
  buildFeatures(schemaDir, generatedDir, writeFile);
  buildNode(schemaDir, generatedDir, false, writeFile);
  buildPython(schemaDir, generatedDir, false, writeFile);
  buildReactViews(schemaDir, generatedDir);
};
