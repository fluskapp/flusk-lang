/**
 * File system watcher for schema directory.
 * Uses node:fs watch API (recursive).
 */

import { watch } from 'node:fs';
import { rebuildAll } from './rebuild.js';
import type { WatchOptions } from './watch-types.js';

const isYamlFile = (filename: string): boolean =>
  filename.endsWith('.yaml') || filename.endsWith('.yml');

export const createSchemaWatcher = (
  options: WatchOptions
): AbortController => {
  const { schemaDir, generatedDir, onEvent } = options;
  const ac = new AbortController();

  const watcher = watch(
    schemaDir,
    { recursive: true, signal: ac.signal },
  );

  watcher.on('change', (_eventType, filename) => {
    if (!filename || !isYamlFile(String(filename))) return;
    const filePath = String(filename);

    onEvent({ type: 'change', filePath });
    const start = Date.now();

    try {
      rebuildAll(schemaDir, generatedDir);
      const durationMs = Date.now() - start;
      onEvent({ type: 'success', filePath, durationMs });
    } catch (err: unknown) {
      const message = err instanceof Error
        ? err.message : String(err);
      onEvent({ type: 'error', filePath, error: message });
    }
  });

  watcher.on('error', () => {
    onEvent({ type: 'stop' });
  });

  watcher.on('close', () => {
    onEvent({ type: 'stop' });
  });

  return ac;
};
