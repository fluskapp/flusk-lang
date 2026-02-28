import { describe, it, expect } from 'vitest';
import { InviteRepository } from '../src/entities/invite.repository.js';

describe('Invite Entity', () => {
  it('creates a invite', async () => {
    const repo = new InviteRepository();
    const data = {
      org_id: 'test',
      email: 'test-email',
      role: 'admin',
      token: 'test-token',
      expires_at: 'test',
      accepted: true,
    };
    const result = await repo.create(data);
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it('findByToken', async () => {
    const repo = new InviteRepository();
    const result = await repo.findByToken();
    expect(Array.isArray(result)).toBe(true);
  });

  it('findPendingByOrg', async () => {
    const repo = new InviteRepository();
    const result = await repo.findPendingByOrg();
    expect(Array.isArray(result)).toBe(true);
  });
});
