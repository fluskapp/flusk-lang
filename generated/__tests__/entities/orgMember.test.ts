import { describe, it, expect } from 'vitest';
import { OrgMemberRepository } from '../src/entities/orgMember.repository.js';

describe('OrgMember Entity', () => {
  it('creates a orgMember', async () => {
    const repo = new OrgMemberRepository();
    const data = {
      org_id: 'test',
      email: 'test-email',
      name: 'test-name',
      role: 'owner',
      password_hash: 'test-password_hash',
      status: 'active',
      last_login_at: 'test',
    };
    const result = await repo.create(data);
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it('findByEmail', async () => {
    const repo = new OrgMemberRepository();
    const result = await repo.findByEmail();
    expect(Array.isArray(result)).toBe(true);
  });

  it('findByOrg', async () => {
    const repo = new OrgMemberRepository();
    const result = await repo.findByOrg();
    expect(Array.isArray(result)).toBe(true);
  });

  it('findByOrgAndEmail', async () => {
    const repo = new OrgMemberRepository();
    const result = await repo.findByOrgAndEmail();
    expect(Array.isArray(result)).toBe(true);
  });
});
