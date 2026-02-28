import { describe, it, expect } from 'vitest';
import { UsageDailyRepository } from '../src/entities/usageDaily.repository.js';

describe('UsageDaily Entity', () => {
  it('creates a usageDaily', async () => {
    const repo = new UsageDailyRepository();
    const data = {
      org_id: 'test',
      device_id: 'test-device_id',
      provider: 'test-provider',
      model: 'test-model',
      date: 'test',
      request_count: 'test',
      total_input_tokens: 'test',
      total_output_tokens: 'test',
      total_cost_usd: 'test',
      total_latency_ms: 'test',
      shadow_count: 'test',
    };
    const result = await repo.create(data);
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it('findByOrgAndDate', async () => {
    const repo = new UsageDailyRepository();
    const result = await repo.findByOrgAndDate();
    expect(Array.isArray(result)).toBe(true);
  });

  it('findByOrgRange', async () => {
    const repo = new UsageDailyRepository();
    const result = await repo.findByOrgRange();
    expect(Array.isArray(result)).toBe(true);
  });

  it('findByDevice', async () => {
    const repo = new UsageDailyRepository();
    const result = await repo.findByDevice();
    expect(Array.isArray(result)).toBe(true);
  });
});
