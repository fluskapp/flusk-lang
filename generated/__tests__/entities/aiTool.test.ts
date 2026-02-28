import { describe, it, expect } from 'vitest';
import { AiToolRepository } from '../src/entities/aiTool.repository.js';

describe('AiTool Entity', () => {
  it('creates a aiTool', async () => {
    const repo = new AiToolRepository();
    const data = {
      org_id: 'test',
      name: 'test-name',
      provider: 'test-provider',
      category: 'chat',
      approved: true,
      detection_pattern: 'test-detection_pattern',
      first_seen_at: 'test',
      last_seen_at: 'test',
    };
    const result = await repo.create(data);
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it('findByOrg', async () => {
    const repo = new AiToolRepository();
    const result = await repo.findByOrg();
    expect(Array.isArray(result)).toBe(true);
  });

  it('findByOrgAndName', async () => {
    const repo = new AiToolRepository();
    const result = await repo.findByOrgAndName();
    expect(Array.isArray(result)).toBe(true);
  });

  it('findUnapproved', async () => {
    const repo = new AiToolRepository();
    const result = await repo.findUnapproved();
    expect(Array.isArray(result)).toBe(true);
  });
});
