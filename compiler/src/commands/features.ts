/**
 * Feature commands — explode, diff, build features
 */

import { join } from 'node:path';
import { loadFeatures } from '../parsers/feature.parser.js';
import { explodeFeature, writeExploded, diffFeature } from '../exploder/index.js';
import { generateMigrations } from '../generators/node/migration.gen.js';
import { generateAllTests } from '../generators/node/test.gen.js';
import { generateWattProject } from '../generators/watt/index.js';
import type { WriteFileFn } from './types.js';

export const explodeFeatures = (schemaDir: string): void => {
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

export const diffFeatures = (schemaDir: string): void => {
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

export const buildFeatures = (
  schemaDir: string,
  generatedDir: string,
  writeFile: WriteFileFn,
): void => {
  const featuresDir = join(schemaDir, 'features');
  const features = loadFeatures(featuresDir);

  if (features.length === 0) {
    console.log('ℹ️  No .feature.yaml files found');
    return;
  }

  for (const feature of features) {
    console.log(`\n🔧 Building feature: ${feature.name}`);

    const exploded = explodeFeature(feature);
    const changeset = diffFeature(exploded, schemaDir);
    console.log(`   Changes: +${changeset.summary.added} ~${changeset.summary.modified} -${changeset.summary.removed} =${changeset.summary.unchanged}`);

    if (changeset.breaking.length > 0) {
      console.log('   ⚠️  Breaking changes:');
      for (const b of changeset.breaking) console.log(`      ❌ ${b.message}`);
    }

    const writeResult = writeExploded(exploded, schemaDir, { overwrite: true });
    for (const f of writeResult.written) console.log(`   ✨ ${f}`);
    for (const f of writeResult.updated) console.log(`   📝 ${f}`);

    if (changeset.fields.length > 0 || changeset.files.some((f) => f.type === 'entity' && f.kind === 'added')) {
      const migrations = generateMigrations(changeset);
      const migrationsDir = join(generatedDir, 'migrations');
      for (const m of migrations) {
        const path = join(migrationsDir, `${m.timestamp}_${m.name}.sql`);
        writeFile(path, `-- Up\n${m.up}\n\n-- Down\n${m.down}\n`);
        console.log(`   🗃️  migration: ${m.timestamp}_${m.name}.sql`);
      }
    }

    const tests = generateAllTests(feature);
    for (const t of tests) {
      const path = join(generatedDir, t.path);
      writeFile(path, t.content);
      console.log(`   🧪 test: ${t.path}`);
    }
  }

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
