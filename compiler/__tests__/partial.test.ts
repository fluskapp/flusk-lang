import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { loadPartials } from '../src/parsers/partial.parser.js';
import { buildViews } from '../src/pipeline.js';

const fixturesDir = resolve(__dirname, 'fixtures');

describe('Partial Parser', () => {
  it('loads partials from directory', () => {
    const partials = loadPartials(resolve(__dirname, '../../schema/partials'));
    // No partials in flusk-lang schema dir (they're in flusk-app)
    // But the function should not crash
    expect(partials).toBeDefined();
  });

  it('returns empty map for nonexistent dir', () => {
    const partials = loadPartials('/tmp/no-such-dir-partials');
    expect(partials.size).toBe(0);
  });
});

describe('Pipeline with partials', () => {
  it('builds views without partials dir', () => {
    const result = buildViews(
      resolve(__dirname, '../../schema/views'),
    );
    expect(result.pages.length).toBeGreaterThan(0);
  });

  it('builds views with partials dir (even if empty)', () => {
    const result = buildViews(
      resolve(__dirname, '../../schema/views'),
      undefined,
      '/tmp/no-such-partials',
    );
    expect(result.pages.length).toBeGreaterThan(0);
  });
});
