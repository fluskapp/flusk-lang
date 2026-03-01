import { describe, it, expect } from 'vitest';
import { generateWattHook } from '../src/generators/watt/hook.gen.js';
import type { HookDef } from '../src/parsers/hook.parser.js';

describe('Watt hook generator', () => {
  it('generates pre and post hooks', () => {
    const hook: HookDef = {
      name: 'org-hooks',
      entity: 'Organization',
      lifecycle: [
        { event: 'preSave', call: 'validateOrg' },
        { event: 'postSave', call: 'notifyCreated' },
      ],
    };
    const result = generateWattHook(hook);
    expect(result).toContain("addHook('save'");
    expect(result).toContain("addHook('afterSave'");
    expect(result).toContain('validateOrg');
    expect(result).toContain('notifyCreated');
    expect(result).toContain('organization');
    expect(result).not.toContain('as any');
  });
});
