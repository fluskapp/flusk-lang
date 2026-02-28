import { describe, it, expect } from 'vitest';
import { AlertRepository } from '../src/entities/alert.repository.js';

describe('Alert Entity', () => {
  it('creates a alert', async () => {
    const repo = new AlertRepository();
    const data = {
      org_id: 'test',
      rule_id: 'test',
      type: 'shadow-ai',
      severity: 'low',
      title: 'test-title',
      message: 'test-message',
      context: 'test',
      status: 'open',
      resolved_at: 'test',
    };
    const result = await repo.create(data);
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it('findByOrg', async () => {
    const repo = new AlertRepository();
    const result = await repo.findByOrg();
    expect(Array.isArray(result)).toBe(true);
  });

  it('findOpenByOrg', async () => {
    const repo = new AlertRepository();
    const result = await repo.findOpenByOrg();
    expect(Array.isArray(result)).toBe(true);
  });

  it('findByType', async () => {
    const repo = new AlertRepository();
    const result = await repo.findByType();
    expect(Array.isArray(result)).toBe(true);
  });
});
