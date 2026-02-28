/**
 * Exploded YAML Writer — writes sub-YAMLs to the schema directory
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import type { ExplodedFiles } from './exploder.js';

export interface WriteResult {
  written: string[];
  skipped: string[];
  updated: string[];
}

export const writeExploded = (
  exploded: ExplodedFiles,
  schemaDir: string,
  options: { overwrite?: boolean; dryRun?: boolean } = {},
): WriteResult => {
  const result: WriteResult = { written: [], skipped: [], updated: [] };

  for (const file of exploded.files) {
    const fullPath = join(schemaDir, file.path);

    if (options.dryRun) {
      if (existsSync(fullPath)) {
        const existing = readFileSync(fullPath, 'utf-8');
        if (existing === file.content) {
          result.skipped.push(file.path);
        } else {
          result.updated.push(file.path);
        }
      } else {
        result.written.push(file.path);
      }
      continue;
    }

    if (existsSync(fullPath) && !options.overwrite) {
      const existing = readFileSync(fullPath, 'utf-8');
      if (existing === file.content) {
        result.skipped.push(file.path);
        continue;
      }
      result.updated.push(file.path);
    } else {
      result.written.push(file.path);
    }

    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, file.content, 'utf-8');
  }

  return result;
};
