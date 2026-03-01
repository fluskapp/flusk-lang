#!/usr/bin/env node

/**
 * flusk-lang CLI entry point
 */

import { resolve, join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { validate } from './index.js';
import { buildNode } from './commands/build-node.js';
import { buildPython } from './commands/build-python.js';
import { buildReactViews } from './commands/build-views.js';
import { explodeFeatures, diffFeatures, buildFeatures } from './commands/features.js';
import { watchSchemas } from './commands/watch.js';
import { generateOpenApi } from './commands/openapi.js';
import { generateClient } from './commands/client-sdk.js';
import type { WatchEvent } from './commands/watch-types.js';
import { setLogLevel, createChildLogger } from './logger.js';

const verbose = process.argv.includes('--verbose');
const quiet = process.argv.includes('--quiet');
if (verbose) setLogLevel('debug');
else if (quiet) setLogLevel('silent');

const log = createChildLogger('cli');

const schemaDirArg = process.argv.includes('--schema-dir')
  ? resolve(process.argv[process.argv.indexOf('--schema-dir') + 1]!)
  : undefined;
const rootDir = schemaDirArg ? resolve(schemaDirArg, '..') : resolve(process.cwd(), '..');
const schemaDir = schemaDirArg ?? join(rootDir, 'schema');
const generatedDir = join(rootDir, 'generated');

const command = process.argv[2];
const target = process.argv.includes('--target')
  ? process.argv[process.argv.indexOf('--target') + 1]! : 'all';
const skipRefs = process.argv.includes('--skip-refs');

const writeFile = (path: string, content: string): void => {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, content, 'utf-8');
  log.info({ path }, 'wrote file');
};

if (command === 'diff') {
  try { diffFeatures(schemaDir); }
  catch (err) { log.error({ err }, 'diff failed'); process.exit(1); }
} else if (command === 'explode') {
  try { explodeFeatures(schemaDir); }
  catch (err) { log.error({ err }, 'explode failed'); process.exit(1); }
} else if (command === 'validate') {
  const vlog = createChildLogger('validate');
  try {
    const schema = validate(schemaDir);
    const count = Object.values(schema).reduce((sum, arr) => sum + arr.length, 0);
    vlog.info({ count }, 'validation passed');
  } catch (err) { vlog.error({ err }, 'validation failed'); process.exit(1); }
} else if (command === 'build') {
  const blog = createChildLogger('build');
  try {
    if (target === 'all' || target === 'features') buildFeatures(schemaDir, generatedDir, writeFile);
    if (target === 'all' || target === 'node') buildNode(schemaDir, generatedDir, skipRefs, writeFile);
    if (target === 'all' || target === 'python') buildPython(schemaDir, generatedDir, skipRefs, writeFile);
    if (target === 'all' || target === 'views') buildReactViews(schemaDir, generatedDir);
    blog.info('build complete');
  } catch (err) { blog.error({ err }, 'build failed'); process.exit(1); }
} else if (command === 'watch') {
  const wlog = createChildLogger('watch');
  const formatEvent = (event: WatchEvent): void => {
    switch (event.type) {
      case 'start':
        wlog.info({ schemaDir: event.schemaDir }, 'watching for changes');
        break;
      case 'change':
        wlog.info({ file: event.filePath }, 'file changed');
        break;
      case 'success':
        wlog.info({ durationMs: event.durationMs }, 'rebuilt');
        break;
      case 'error':
        wlog.error({ error: event.error }, 'rebuild error');
        break;
      case 'stop':
        wlog.info('watcher stopped');
        break;
    }
  };
  watchSchemas({ schemaDir, generatedDir, onEvent: formatEvent });
} else if (command === 'openapi') {
  const olog = createChildLogger('openapi');
  try {
    const outputPath = generateOpenApi(schemaDir, generatedDir);
    olog.info({ outputPath }, 'OpenAPI spec generated');
  } catch (err) { olog.error({ err }, 'openapi generation failed'); process.exit(1); }
} else if (command === 'client') {
  const clog = createChildLogger('client');
  try {
    const outputDir = generateClient(schemaDir, generatedDir);
    clog.info({ outputDir }, 'client SDK generated');
  } catch (err) { clog.error({ err }, 'client generation failed'); process.exit(1); }
} else {
  log.info('Usage: flusk-lang <diff|explode|validate|build|watch|openapi|client> [--target node|python|views] [--schema-dir path] [--verbose] [--quiet]');
}
