import { describe, it, expect } from 'vitest';
import { generateCommandPlugin } from '../src/generators/watt/command.gen.js';
import type { FeatureCommand } from '../src/ast/feature.js';

describe('Watt command generator', () => {
  it('generates command plugin with route per command', () => {
    const commands: FeatureCommand[] = [
      { name: 'sync-data', subcommands: [] },
      { name: 'run-migration', subcommands: [] },
    ];
    const result = generateCommandPlugin(commands);
    expect(result).toContain("app.post('/commands/sync-data'");
    expect(result).toContain("app.post('/commands/run-migration'");
    expect(result).toContain('fastify-plugin');
    expect(result).toContain('@generated');
    expect(result).not.toContain('as any');
  });

  it('returns empty string for no commands', () => {
    expect(generateCommandPlugin([])).toBe('');
  });
});
