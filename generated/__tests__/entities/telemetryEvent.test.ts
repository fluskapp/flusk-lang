import { describe, it, expect } from 'vitest';
import { TelemetryEventRepository } from '../src/entities/telemetryEvent.repository.js';

describe('TelemetryEvent Entity', () => {
  it('creates a telemetryEvent', async () => {
    const repo = new TelemetryEventRepository();
    const data = {
      org_id: 'test',
      device_id: 'test-device_id',
      trace_id: 'test-trace_id',
      span_id: 'test-span_id',
      provider: 'test-provider',
      model: 'test-model',
      tool_name: 'test-tool_name',
      input_tokens: 'test',
      output_tokens: 'test',
      latency_ms: 'test',
      cost_usd: 'test',
      status_code: 'test',
      is_approved: true,
      metadata: 'test',
    };
    const result = await repo.create(data);
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it('findByOrg', async () => {
    const repo = new TelemetryEventRepository();
    const result = await repo.findByOrg();
    expect(Array.isArray(result)).toBe(true);
  });

  it('findByDevice', async () => {
    const repo = new TelemetryEventRepository();
    const result = await repo.findByDevice();
    expect(Array.isArray(result)).toBe(true);
  });

  it('findByProvider', async () => {
    const repo = new TelemetryEventRepository();
    const result = await repo.findByProvider();
    expect(Array.isArray(result)).toBe(true);
  });

  it('findShadowAI', async () => {
    const repo = new TelemetryEventRepository();
    const result = await repo.findShadowAI();
    expect(Array.isArray(result)).toBe(true);
  });
});
