#!/usr/bin/env node
import { resolve, join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { parseAll, validate } from './index.js';
import { generateEntitySchema, generateEntityType, generateEntityRepository } from './generators/node/entity.gen.js';
import { generateFunction } from './generators/node/function.gen.js';

const rootDir = resolve(process.cwd(), '..');
const schemaDir = join(rootDir, 'schema');
const generatedDir = join(rootDir, 'generated');

const command = process.argv[2];
const target = process.argv.includes('--target') ? process.argv[process.argv.indexOf('--target') + 1] : 'all';

const writeFile = (path: string, content: string): void => {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, content, 'utf-8');
  console.log(`  wrote ${path}`);
};

const buildNode = (): void => {
  const schema = validate(schemaDir);
  const nodeDir = join(generatedDir, 'node', 'src');

  for (const entity of schema.entities) {
    const dir = join(nodeDir, 'entities');
    const name = entity.name.toLowerCase();
    writeFile(join(dir, `${name}.schema.ts`), generateEntitySchema(entity));
    writeFile(join(dir, `${name}.types.ts`), generateEntityType(entity));
    writeFile(join(dir, `${name}.repository.ts`), generateEntityRepository(entity));
  }

  for (const fn of schema.functions) {
    writeFile(join(nodeDir, 'functions', `${fn.name}.function.ts`), generateFunction(fn));
  }

  console.log('✅ Node.js generation complete');
};

const buildPython = (): void => {
  console.log('⚠️  Python generation not yet implemented');
};

if (command === 'validate') {
  try {
    const schema = validate(schemaDir);
    const count = Object.values(schema).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`✅ Validated ${count} definitions`);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
} else if (command === 'build') {
  try {
    if (target === 'all' || target === 'node') buildNode();
    if (target === 'all' || target === 'python') buildPython();
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
} else if (command === 'diff') {
  console.log('⚠️  Diff not yet implemented');
} else if (command === 'init') {
  console.log('⚠️  Init not yet implemented');
} else {
  console.log('Usage: flusk-lang <validate|build|diff|init> [--target node|python]');
}
