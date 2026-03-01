import { describe, it, expect } from 'vitest';
import { generateMiddlewarePlugin } from '../src/generators/watt/middleware.gen.js';
import type { FeatureMiddleware } from '../src/ast/feature.js';

describe('Watt middleware generator', () => {
  it('generates middleware plugin with hooks', () => {
    const middlewares: FeatureMiddleware[] = [
      { name: 'rate-limit', type: 'request' },
      { name: 'response-logger', type: 'response' },
    ];
    const result = generateMiddlewarePlugin(middlewares);
    expect(result).toContain("addHook('onRequest'");
    expect(result).toContain("addHook('onSend'");
    expect(result).toContain('fastify-plugin');
    expect(result).not.toContain('as any');
  });

  it('returns empty string for no middleware', () => {
    expect(generateMiddlewarePlugin([])).toBe('');
  });
});
