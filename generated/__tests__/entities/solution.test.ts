import { describe, it, expect } from 'vitest';
import { SolutionRepository } from '../src/entities/solution.repository.js';

describe('Solution Entity', () => {
  it('creates a solution', async () => {
    const repo = new SolutionRepository();
    const data = {
      org_id: 'test',
      name: 'test-name',
      description: 'test-description',
      type: 'openclaw',
      llm_provider: 'openai',
      llm_model: 'test-llm_model',
      system_prompt: 'test-system_prompt',
      temperature: 'test',
      max_tokens: 'test',
      tools_config: 'test',
      status: 'draft',
      created_by: 'test',
      published_at: 'test',
    };
    const result = await repo.create(data);
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it('findByOrg', async () => {
    const repo = new SolutionRepository();
    const result = await repo.findByOrg();
    expect(Array.isArray(result)).toBe(true);
  });

  it('findPublished', async () => {
    const repo = new SolutionRepository();
    const result = await repo.findPublished();
    expect(Array.isArray(result)).toBe(true);
  });

  it('findByStatus', async () => {
    const repo = new SolutionRepository();
    const result = await repo.findByStatus();
    expect(Array.isArray(result)).toBe(true);
  });
});
