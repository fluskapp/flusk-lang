#!/usr/bin/env node
import { resolve, join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { parseAll, validate } from './index.js';
import { generateEntitySchema, generateEntityType, generateEntityRepository } from './generators/node/entity.gen.js';
import { generateFunction } from './generators/node/function.gen.js';
import { generateCommand } from './generators/node/command.gen.js';
import { generateRoute } from './generators/node/route.gen.js';
import { generateProvider } from './generators/node/provider.gen.js';
import { generateClient } from './generators/node/client.gen.js';
import { generateBarrel } from './generators/node/barrel.gen.js';
import { generateService } from './generators/node/service.gen.js';
import { generateMiddleware } from './generators/node/middleware.gen.js';
import { generatePlugin } from './generators/node/plugin.gen.js';
import { generateEvent } from './generators/node/event.gen.js';
import { generateWorker } from './generators/node/worker.gen.js';
import { generateStream } from './generators/node/stream.gen.js';
import { generateHook } from './generators/node/hook.gen.js';
import { generatePythonEntity } from './generators/python/entity.gen.js';
import { generatePythonFunction } from './generators/python/function.gen.js';
import { generateMigrations } from './generators/node/migration.gen.js';
import { generateAllTests } from './generators/node/test.gen.js';
import { generateWattProject } from './generators/watt/index.js';

const schemaDirArg = process.argv.includes('--schema-dir')
  ? resolve(process.argv[process.argv.indexOf('--schema-dir') + 1])
  : undefined;
const rootDir = schemaDirArg ? resolve(schemaDirArg, '..') : resolve(process.cwd(), '..');
const schemaDir = schemaDirArg ?? join(rootDir, 'schema');
const generatedDir = join(rootDir, 'generated');

const command = process.argv[2];
const target = process.argv.includes('--target')
  ? process.argv[process.argv.indexOf('--target') + 1] : 'all';
const skipRefs = process.argv.includes('--skip-refs');

const writeFile = (path: string, content: string): void => {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, content, 'utf-8');
  console.log(`  wrote ${path}`);
};

const buildNode = (): void => {
  const schema = skipRefs ? parseAll(schemaDir) : validate(schemaDir);
  const nodeDir = join(generatedDir, 'node', 'src');
  const allFiles: string[] = [];

  for (const entity of schema.entities) {
    const dir = join(nodeDir, 'entities');
    const name = entity.name.toLowerCase();
    writeFile(join(dir, `${name}.schema.ts`), generateEntitySchema(entity));
    writeFile(join(dir, `${name}.types.ts`), generateEntityType(entity));
    writeFile(join(dir, `${name}.repository.ts`), generateEntityRepository(entity));
    allFiles.push(`entities/${name}.schema.ts`, `entities/${name}.types.ts`);
  }

  for (const fn of schema.functions) {
    const f = `functions/${fn.name}.function.ts`;
    writeFile(join(nodeDir, f), generateFunction(fn));
    allFiles.push(f);
  }

  for (const cmd of schema.commands) {
    const f = `commands/${cmd.name}.command.ts`;
    writeFile(join(nodeDir, f), generateCommand(cmd));
    allFiles.push(f);
  }

  for (const route of schema.routes) {
    const f = `routes/${route.name}.routes.ts`;
    writeFile(join(nodeDir, f), generateRoute(route));
    allFiles.push(f);
  }

  for (const provider of schema.providers) {
    const f = `providers/${provider.name}.provider.ts`;
    writeFile(join(nodeDir, f), generateProvider(provider));
    allFiles.push(f);
  }

  for (const client of schema.clients) {
    const f = `clients/${client.name}.client.ts`;
    writeFile(join(nodeDir, f), generateClient(client));
    allFiles.push(f);
  }

  for (const svc of schema.services) {
    const f = `services/${svc.name}.service.ts`;
    writeFile(join(nodeDir, f), generateService(svc));
    allFiles.push(f);
  }

  for (const mw of schema.middlewares) {
    const f = `middlewares/${mw.name}.middleware.ts`;
    writeFile(join(nodeDir, f), generateMiddleware(mw));
    allFiles.push(f);
  }

  for (const plugin of schema.plugins) {
    const f = `plugins/${plugin.name}.plugin.ts`;
    writeFile(join(nodeDir, f), generatePlugin(plugin));
    allFiles.push(f);
  }

  for (const event of schema.events) {
    const f = `events/${event.name}.event.ts`;
    writeFile(join(nodeDir, f), generateEvent(event));
    allFiles.push(f);
  }

  for (const worker of schema.workers) {
    const f = `workers/${worker.name}.worker.ts`;
    writeFile(join(nodeDir, f), generateWorker(worker));
    allFiles.push(f);
  }

  for (const stream of schema.streams) {
    const f = `streams/${stream.name}.stream.ts`;
    writeFile(join(nodeDir, f), generateStream(stream));
    allFiles.push(f);
  }

  for (const hook of schema.hooks) {
    const f = `hooks/${hook.name}.hook.ts`;
    writeFile(join(nodeDir, f), generateHook(hook));
    allFiles.push(f);
  }

  writeFile(join(nodeDir, 'index.ts'), generateBarrel(allFiles));
  console.log('✅ Node.js generation complete');
};

const buildPython = (): void => {
  const schema = skipRefs ? parseAll(schemaDir) : validate(schemaDir);
  const pyDir = join(generatedDir, 'python');

  for (const entity of schema.entities) {
    writeFile(join(pyDir, 'entities', `${entity.name.toLowerCase()}.py`), generatePythonEntity(entity));
  }

  for (const fn of schema.functions) {
    writeFile(join(pyDir, 'functions', `${fn.name}.py`), generatePythonFunction(fn));
  }

  console.log('✅ Python generation complete');
};

import { buildViews } from './pipeline.js';
import { dirname } from 'node:path';

const buildReactViews = (): void => {
  const viewsDir = join(schemaDir, 'views');
  const widgetsDir = join(schemaDir, 'widgets');
  const partialsDir = join(schemaDir, 'partials');
  const outDir = join(generatedDir, 'views');

  const result = buildViews(viewsDir, widgetsDir, partialsDir);

  // Report diagnostics
  for (const d of result.diagnostics) {
    const icon = d.severity === 'error' ? '❌' : d.severity === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`  ${icon} ${d.code}: ${d.message} (${d.file}:${d.line})`);
  }

  const errors = result.diagnostics.filter((d) => d.severity === 'error');
  if (errors.length > 0) {
    console.error(`\n❌ ${errors.length} error(s) found`);
    process.exit(1);
  }

  // Write files
  for (const file of result.files) {
    const fullPath = join(outDir, file.path);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, file.content, 'utf-8');
    console.log(`  wrote ${fullPath}`);
  }

  console.log(`\n✅ Generated ${result.files.length} files from ${result.pages.length} views`);
};

import { loadFeatures } from './parsers/feature.parser.js';
import { explodeFeature } from './exploder/index.js';
import { writeExploded } from './exploder/index.js';
import { diffFeature } from './exploder/index.js';

const explodeFeatures = (): void => {
  const featuresDir = join(schemaDir, 'features');
  const features = loadFeatures(featuresDir);

  if (features.length === 0) {
    console.log('ℹ️  No .feature.yaml files found');
    return;
  }

  const dryRun = process.argv.includes('--dry-run');

  for (const feature of features) {
    console.log(`\n🔧 Exploding: ${feature.name}`);
    const exploded = explodeFeature(feature);
    const result = writeExploded(exploded, schemaDir, { overwrite: true, dryRun });

    for (const f of result.written) console.log(`  ✨ new: ${f}`);
    for (const f of result.updated) console.log(`  📝 updated: ${f}`);
    for (const f of result.skipped) console.log(`  ⏭️  unchanged: ${f}`);

    const total = result.written.length + result.updated.length;
    console.log(`  → ${exploded.files.length} files (${total} changed)`);
  }

  console.log(`\n✅ Exploded ${features.length} feature(s)`);
};

const diffFeatures = (): void => {
  const featuresDir = join(schemaDir, 'features');
  const features = loadFeatures(featuresDir);

  if (features.length === 0) {
    console.log('ℹ️  No .feature.yaml files found');
    return;
  }

  for (const feature of features) {
    const exploded = explodeFeature(feature);
    const changeset = diffFeature(exploded, schemaDir);

    console.log(`\n📊 Diff: ${feature.name}`);
    console.log(`   Added: ${changeset.summary.added} | Modified: ${changeset.summary.modified} | Removed: ${changeset.summary.removed} | Unchanged: ${changeset.summary.unchanged}`);

    for (const f of changeset.files) {
      const icon = f.kind === 'added' ? '✨' : f.kind === 'modified' ? '📝' : f.kind === 'removed' ? '🗑️' : '⏭️';
      if (f.kind !== 'unchanged') console.log(`   ${icon} ${f.path}`);
    }

    if (changeset.fields.length > 0) {
      console.log('\n   Field changes:');
      for (const fc of changeset.fields) {
        const icon = fc.kind === 'added' ? '+' : fc.kind === 'removed' ? '-' : '~';
        console.log(`   ${icon} ${fc.entity}.${fc.field} (${fc.kind})`);
      }
    }

    if (changeset.breaking.length > 0) {
      console.log('\n   ⚠️  Breaking changes:');
      for (const b of changeset.breaking) {
        console.log(`   ❌ ${b.message}`);
      }
    }
  }
};

const buildFeatures = (): void => {
  const featuresDir = join(schemaDir, 'features');
  const features = loadFeatures(featuresDir);

  if (features.length === 0) {
    console.log('ℹ️  No .feature.yaml files found');
    return;
  }

  for (const feature of features) {
    console.log(`\n🔧 Building feature: ${feature.name}`);

    // 1. Explode
    const exploded = explodeFeature(feature);

    // 2. Diff
    const changeset = diffFeature(exploded, schemaDir);
    console.log(`   Changes: +${changeset.summary.added} ~${changeset.summary.modified} -${changeset.summary.removed} =${changeset.summary.unchanged}`);

    if (changeset.breaking.length > 0) {
      console.log('   ⚠️  Breaking changes:');
      for (const b of changeset.breaking) console.log(`      ❌ ${b.message}`);
    }

    // 3. Write sub-YAMLs
    const writeResult = writeExploded(exploded, schemaDir, { overwrite: true });
    for (const f of writeResult.written) console.log(`   ✨ ${f}`);
    for (const f of writeResult.updated) console.log(`   📝 ${f}`);

    // 4. Generate migrations
    if (changeset.fields.length > 0 || changeset.files.some((f) => f.type === 'entity' && f.kind === 'added')) {
      const migrations = generateMigrations(changeset);
      const migrationsDir = join(generatedDir, 'migrations');
      for (const m of migrations) {
        const path = join(migrationsDir, `${m.timestamp}_${m.name}.sql`);
        writeFile(path, `-- Up\n${m.up}\n\n-- Down\n${m.down}\n`);
        console.log(`   🗃️  migration: ${m.timestamp}_${m.name}.sql`);
      }
    }

    // 5. Generate tests
    const tests = generateAllTests(feature);
    for (const t of tests) {
      const path = join(generatedDir, t.path);
      writeFile(path, t.content);
      console.log(`   🧪 test: ${t.path}`);
    }
  }

  // 6. Watt project generation
  console.log('\n📦 Generating Watt project...');
  const wattFiles = generateWattProject(features);
  const wattDir = join(generatedDir, 'watt');
  for (const file of wattFiles) {
    const path = join(wattDir, file.path);
    writeFile(path, file.content);
  }
  console.log(`   → ${wattFiles.length} files generated`);

  console.log('\n✅ Feature build complete');
};

if (command === 'diff') {
  try {
    diffFeatures();
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
} else if (command === 'explode') {
  try {
    explodeFeatures();
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
} else if (command === 'validate') {
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
    if (target === 'all' || target === 'features') buildFeatures();
    if (target === 'all' || target === 'node') buildNode();
    if (target === 'all' || target === 'python') buildPython();
    if (target === 'all' || target === 'views') buildReactViews();
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
} else {
  console.log('Usage: flusk-lang <diff|explode|validate|build> [--target node|python|views] [--schema-dir path] [--dry-run]');
}
