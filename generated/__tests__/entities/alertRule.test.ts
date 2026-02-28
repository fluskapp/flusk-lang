import { describe, it, expect } from 'vitest';
import { AlertRuleRepository } from '../src/entities/alertRule.repository.js';

describe('AlertRule Entity', () => {
  it('creates a alertRule', async () => {
    const repo = new AlertRuleRepository();
    const data = {
      org_id: 'test',
      name: 'test-name',
      type: 'shadow-ai',
      threshold: 'test',
      channels: 'test',
      enabled: true,
    };
    const result = await repo.create(data);
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it('findByOrg', async () => {
    const repo = new AlertRuleRepository();
    const result = await repo.findByOrg();
    expect(Array.isArray(result)).toBe(true);
  });

  it('findEnabledByOrg', async () => {
    const repo = new AlertRuleRepository();
    const result = await repo.findEnabledByOrg();
    expect(Array.isArray(result)).toBe(true);
  });

  it('findByType', async () => {
    const repo = new AlertRuleRepository();
    const result = await repo.findByType();
    expect(Array.isArray(result)).toBe(true);
  });
});
