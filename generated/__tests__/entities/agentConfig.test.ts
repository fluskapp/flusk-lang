import { describe, it, expect } from 'vitest';
import { AgentConfigRepository } from '../src/entities/agentConfig.repository.js';

describe('AgentConfig Entity', () => {
  it('creates a agentConfig', async () => {
    const repo = new AgentConfigRepository();
    const data = {
      org_id: 'test',
      version: 'test',
      otel_endpoint: 'test-otel_endpoint',
      heartbeat_interval_ms: 'test',
      approved_tools: 'test',
      intercept_patterns: 'test',
      solutions: 'test',
    };
    const result = await repo.create(data);
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it('findByOrg', async () => {
    const repo = new AgentConfigRepository();
    const result = await repo.findByOrg();
    expect(Array.isArray(result)).toBe(true);
  });

  it('findLatest', async () => {
    const repo = new AgentConfigRepository();
    const result = await repo.findLatest();
    expect(Array.isArray(result)).toBe(true);
  });
});
