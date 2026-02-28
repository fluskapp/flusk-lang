import { describe, it, expect } from 'vitest';
import { AgentDeviceRepository } from '../src/entities/agentDevice.repository.js';

describe('AgentDevice Entity', () => {
  it('creates a agentDevice', async () => {
    const repo = new AgentDeviceRepository();
    const data = {
      org_id: 'test',
      device_id: 'test-device_id',
      hostname: 'test-hostname',
      os: 'test-os',
      arch: 'test-arch',
      agent_version: 'test-agent_version',
      employee_email: 'test-employee_email',
      last_seen_at: 'test',
      status: 'active',
    };
    const result = await repo.create(data);
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it('findByDeviceId', async () => {
    const repo = new AgentDeviceRepository();
    const result = await repo.findByDeviceId();
    expect(Array.isArray(result)).toBe(true);
  });

  it('findByOrg', async () => {
    const repo = new AgentDeviceRepository();
    const result = await repo.findByOrg();
    expect(Array.isArray(result)).toBe(true);
  });

  it('findActiveByOrg', async () => {
    const repo = new AgentDeviceRepository();
    const result = await repo.findActiveByOrg();
    expect(Array.isArray(result)).toBe(true);
  });

  it('findOffline', async () => {
    const repo = new AgentDeviceRepository();
    const result = await repo.findOffline();
    expect(Array.isArray(result)).toBe(true);
  });
});
