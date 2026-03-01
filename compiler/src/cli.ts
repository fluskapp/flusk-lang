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
  console.log(`  wrote ${path}`);
};

if (command === 'diff') {
  try { diffFeatures(schemaDir); }
  catch (err) { console.error((err as Error).message); process.exit(1); }
} else if (command === 'explode') {
  try { explodeFeatures(schemaDir); }
  catch (err) { console.error((err as Error).message); process.exit(1); }
} else if (command === 'validate') {
  try {
    const schema = validate(schemaDir);
    const count = Object.values(schema).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`✅ Validated ${count} definitions`);
  } catch (err) { console.error((err as Error).message); process.exit(1); }
} else if (command === 'build') {
  try {
    if (target === 'all' || target === 'features') buildFeatures(schemaDir, generatedDir, writeFile);
    if (target === 'all' || target === 'node') buildNode(schemaDir, generatedDir, skipRefs, writeFile);
    if (target === 'all' || target === 'python') buildPython(schemaDir, generatedDir, skipRefs, writeFile);
    if (target === 'all' || target === 'views') buildReactViews(schemaDir, generatedDir);
  } catch (err) { console.error((err as Error).message); process.exit(1); }
} else {
  console.log('Usage: flusk-lang <diff|explode|validate|build> [--target node|python|views] [--schema-dir path] [--dry-run]');
}
