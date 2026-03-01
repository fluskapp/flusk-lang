import { describe, it, expect } from 'vitest';
import { validateRefs, RefValidationError } from '../src/validators/refs.validator.js';

const baseEntities = [{ name: 'User', fields: [{ name: 'email', type: 'string' }] }];
const baseFunctions = [{ name: 'handleAlert', inputs: [], steps: [], output: { type: 'void' } }];

describe('refs validator — events, workers, streams', () => {
  it('validates event subscribe.handler references', () => {
    expect(() => validateRefs({
      entities: baseEntities,
      functions: baseFunctions,
      routes: [],
      commands: [],
      events: [{
        name: 'alert-fired',
        channel: 'redis',
        subscribe: { handler: 'nonExistent' },
      }],
    } as Parameters<typeof validateRefs>[0])).toThrow(RefValidationError);
  });

  it('passes when event handler exists', () => {
    expect(() => validateRefs({
      entities: baseEntities,
      functions: baseFunctions,
      routes: [],
      commands: [],
      events: [{
        name: 'alert-fired',
        channel: 'redis',
        subscribe: { handler: 'handleAlert' },
      }],
    } as Parameters<typeof validateRefs>[0])).not.toThrow();
  });

  it('validates worker step calls', () => {
    expect(() => validateRefs({
      entities: baseEntities,
      functions: baseFunctions,
      routes: [],
      commands: [],
      workers: [{
        name: 'cleanup',
        type: 'cron',
        steps: [{ id: 'step1', call: 'missingFn' }],
      }],
    } as Parameters<typeof validateRefs>[0])).toThrow(RefValidationError);
  });

  it('validates stream source entity', () => {
    expect(() => validateRefs({
      entities: baseEntities,
      functions: baseFunctions,
      routes: [],
      commands: [],
      streams: [{
        name: 'feed',
        type: 'sse',
        path: '/feed',
        source: { entity: 'NonExistent' },
      }],
    } as Parameters<typeof validateRefs>[0])).toThrow(RefValidationError);
  });

  it('passes when stream entity exists', () => {
    expect(() => validateRefs({
      entities: baseEntities,
      functions: baseFunctions,
      routes: [],
      commands: [],
      streams: [{
        name: 'feed',
        type: 'sse',
        path: '/feed',
        source: { entity: 'User' },
      }],
    } as Parameters<typeof validateRefs>[0])).not.toThrow();
  });
});
