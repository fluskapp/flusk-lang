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
import { createChildLogger } from '../logger.js';

const log = createChildLogger('features');

export const explodeFeatures = (schemaDir: string): void => {
  const featuresDir = join(schemaDir, 'features');
  const features = loadFeatures(featuresDir);

  if (features.length === 0) {
    log.info('no .feature.yaml files found');
    return;
  }

  const dryRun = process.argv.includes('--dry-run');

  for (const feature of features) {
    log.info({ feature: feature.name }, 'exploding feature');
    const exploded = explodeFeature(feature);
    const result = writeExploded(exploded, schemaDir, { overwrite: true, dryRun });

    for (const f of result.written) log.debug({ file: f }, 'new file');
    for (const f of result.updated) log.debug({ file: f }, 'updated file');
    for (const f of result.skipped) log.debug({ file: f }, 'unchanged file');

    const total = result.written.length + result.updated.length;
    log.info({ files: exploded.files.length, changed: total }, 'exploded');
  }

  log.info({ count: features.length }, 'explode complete');
};

export const diffFeatures = (schemaDir: string): void => {
  const featuresDir = join(schemaDir, 'features');
  const features = loadFeatures(featuresDir);

  if (features.length === 0) {
    log.info('no .feature.yaml files found');
    return;
  }

  for (const feature of features) {
    const exploded = explodeFeature(feature);
    const changeset = diffFeature(exploded, schemaDir);

    log.info({ feature: feature.name }, 'diff');
    log.info(changeset.summary, 'diff summary');

    for (const f of changeset.files) {
      const icon = f.kind === 'added' ? '✨' : f.kind === 'modified' ? '📝' : f.kind === 'removed' ? '🗑️' : '⏭️';
      if (f.kind !== 'unchanged') log.debug({ kind: f.kind, path: f.path }, 'file change');
    }

    if (changeset.fields.length > 0) {
      log.debug('field changes');
      for (const fc of changeset.fields) {
        const icon = fc.kind === 'added' ? '+' : fc.kind === 'removed' ? '-' : '~';
        log.debug({ entity: fc.entity, field: fc.field, kind: fc.kind }, 'field change');
      }
    }

    if (changeset.breaking.length > 0) {
      log.warn('breaking changes detected');
      for (const b of changeset.breaking) {
        log.warn({ message: b.message }, 'breaking change');
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
    log.info('no .feature.yaml files found');
    return;
  }

  for (const feature of features) {
    log.info({ feature: feature.name }, 'building feature');

    const exploded = explodeFeature(feature);
    const changeset = diffFeature(exploded, schemaDir);
    log.info(changeset.summary, 'changeset');

    if (changeset.breaking.length > 0) {
      log.warn('breaking changes');
      for (const b of changeset.breaking) log.warn({ message: b.message }, 'breaking');
    }

    const writeResult = writeExploded(exploded, schemaDir, { overwrite: true });
    for (const f of writeResult.written) log.debug({ file: f }, 'written');
    for (const f of writeResult.updated) log.debug({ file: f }, 'updated');

    if (changeset.fields.length > 0 || changeset.files.some((f) => f.type === 'entity' && f.kind === 'added')) {
      const migrations = generateMigrations(changeset);
      const migrationsDir = join(generatedDir, 'migrations');
      for (const m of migrations) {
        const path = join(migrationsDir, `${m.timestamp}_${m.name}.sql`);
        writeFile(path, `-- Up\n${m.up}\n\n-- Down\n${m.down}\n`);
        log.info({ migration: m.name }, 'migration generated');
      }
    }

    const tests = generateAllTests(feature);
    for (const t of tests) {
      const path = join(generatedDir, t.path);
      writeFile(path, t.content);
      log.debug({ test: t.path }, 'test generated');
    }
  }

  log.info('generating Watt project');
  const wattFiles = generateWattProject(features);
  const wattDir = join(generatedDir, 'watt');
  for (const file of wattFiles) {
    const path = join(wattDir, file.path);
    writeFile(path, file.content);
  }
  log.info({ files: wattFiles.length }, 'Watt files generated');

  log.info('feature build complete');
};
