import { describe, it, expect } from 'vitest';
import { validateRefs, RefValidationError } from '../src/validators/refs.validator.js';
import type { EntityDef } from '../src/parsers/entity.parser.js';
import type { FunctionDef } from '../src/parsers/function.parser.js';

const entity = (name: string): EntityDef => ({ name, fields: [{ name: 'id', type: 'string' }] });
const fn = (name: string, steps: FunctionDef['steps'] = [], inputs?: FunctionDef['inputs']): FunctionDef => ({
  name, steps, inputs,
});

describe('Refs Validator', () => {
  it('passes with valid refs', () => {
    expect(() => validateRefs({
      entities: [entity('AlertChannel')],
      functions: [fn('createAlertChannel', [{ id: 's1' }])],
      routes: [{
        name: 'test', basePath: '/api', entity: 'AlertChannel',
        operations: [{ method: 'POST', path: '/', call: 'createAlertChannel' }],
      }],
      commands: [{ name: 'test', action: { call: 'createAlertChannel' } }],
    })).not.toThrow();
  });

  it('fails on unknown entity ref in route', () => {
    expect(() => validateRefs({
      entities: [],
      functions: [fn('listStuff', [{ id: 's1' }])],
      routes: [{
        name: 'test', basePath: '/api', entity: 'Missing',
        operations: [{ method: 'GET', path: '/', call: 'listStuff' }],
      }],
      commands: [],
    })).toThrow(RefValidationError);
  });

  it('fails on unknown function call in step', () => {
    expect(() => validateRefs({
      entities: [],
      functions: [fn('myFn', [{ id: 's1', call: 'nonExistent' }])],
      routes: [],
      commands: [],
    })).toThrow(RefValidationError);
  });

  it('fails on unknown entity in function input', () => {
    expect(() => validateRefs({
      entities: [],
      functions: [fn('myFn', [{ id: 's1' }], [{ name: 'x', type: 'MissingEntity' }])],
      routes: [],
      commands: [],
    })).toThrow(RefValidationError);
  });

  it('allows Database type without entity', () => {
    expect(() => validateRefs({
      entities: [],
      functions: [fn('myFn', [{ id: 's1' }], [{ name: 'db', type: 'Database' }])],
      routes: [],
      commands: [],
    })).not.toThrow();
  });
});
