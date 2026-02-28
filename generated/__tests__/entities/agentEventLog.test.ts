import { describe, it, expect } from 'vitest';
import { AgentEventLogRepository } from '../src/entities/agentEventLog.repository.js';

describe('AgentEventLog Entity', () => {
  it('creates a agentEventLog', async () => {
    const repo = new AgentEventLogRepository();
    const data = {
      org_id: 'test',
      device_id: 'test-device_id',
      event_type: 'connected',
      details: 'test',
    };
    const result = await repo.create(data);
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it('findByDevice', async () => {
    const repo = new AgentEventLogRepository();
    const result = await repo.findByDevice();
    expect(Array.isArray(result)).toBe(true);
  });

  it('findByOrg', async () => {
    const repo = new AgentEventLogRepository();
    const result = await repo.findByOrg();
    expect(Array.isArray(result)).toBe(true);
  });
});
