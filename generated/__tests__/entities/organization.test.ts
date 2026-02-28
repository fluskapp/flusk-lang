import { describe, it, expect } from 'vitest';
import { OrganizationRepository } from '../src/entities/organization.repository.js';

describe('Organization Entity', () => {
  it('creates a organization', async () => {
    const repo = new OrganizationRepository();
    const data = {
      name: 'test-name',
      slug: 'test-slug',
      plan: 'starter',
      max_seats: 'test',
      api_key: 'test-api_key',
      status: 'active',
      trial_ends_at: 'test',
    };
    const result = await repo.create(data);
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it('findBySlug', async () => {
    const repo = new OrganizationRepository();
    const result = await repo.findBySlug();
    expect(Array.isArray(result)).toBe(true);
  });

  it('findByApiKey', async () => {
    const repo = new OrganizationRepository();
    const result = await repo.findByApiKey();
    expect(Array.isArray(result)).toBe(true);
  });

  it('findActive', async () => {
    const repo = new OrganizationRepository();
    const result = await repo.findActive();
    expect(Array.isArray(result)).toBe(true);
  });
});
