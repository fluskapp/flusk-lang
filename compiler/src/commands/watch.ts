/**
 * Watch command — watches schema/ for YAML changes,
 * re-runs validate + build on each change.
 */

import { resolve } from 'node:path';
import { createSchemaWatcher } from './watcher.js';
import type { WatchOptions } from './watch-types.js';

export const watchSchemas = (options: WatchOptions): AbortController => {
  const { schemaDir, generatedDir, onEvent } = options;
  const resolvedSchema = resolve(schemaDir);
  const resolvedGenerated = resolve(generatedDir);

  onEvent({ type: 'start', schemaDir: resolvedSchema });

  return createSchemaWatcher({
    schemaDir: resolvedSchema,
    generatedDir: resolvedGenerated,
    onEvent,
  });
};
