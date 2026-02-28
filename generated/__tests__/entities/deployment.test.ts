import { describe, it, expect } from 'vitest';
import { DeploymentRepository } from '../src/entities/deployment.repository.js';

describe('Deployment Entity', () => {
  it('creates a deployment', async () => {
    const repo = new DeploymentRepository();
    const data = {
      solution_id: 'test',
      org_id: 'test',
      channel: 'slack',
      channel_config: 'test',
      status: 'active',
      instance_id: 'test-instance_id',
      health_status: 'healthy',
      last_health_check: 'test',
    };
    const result = await repo.create(data);
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it('findBySolution', async () => {
    const repo = new DeploymentRepository();
    const result = await repo.findBySolution();
    expect(Array.isArray(result)).toBe(true);
  });

  it('findByOrg', async () => {
    const repo = new DeploymentRepository();
    const result = await repo.findByOrg();
    expect(Array.isArray(result)).toBe(true);
  });

  it('findActive', async () => {
    const repo = new DeploymentRepository();
    const result = await repo.findActive();
    expect(Array.isArray(result)).toBe(true);
  });

  it('findByInstance', async () => {
    const repo = new DeploymentRepository();
    const result = await repo.findByInstance();
    expect(Array.isArray(result)).toBe(true);
  });
});
