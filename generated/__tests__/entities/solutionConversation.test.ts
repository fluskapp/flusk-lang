import { describe, it, expect } from 'vitest';
import { SolutionConversationRepository } from '../src/entities/solutionConversation.repository.js';

describe('SolutionConversation Entity', () => {
  it('creates a solutionConversation', async () => {
    const repo = new SolutionConversationRepository();
    const data = {
      deployment_id: 'test',
      org_id: 'test',
      user_identifier: 'test-user_identifier',
      message_count: 'test',
      input_tokens: 'test',
      output_tokens: 'test',
      cost_usd: 'test',
      satisfaction: 'test',
      last_message_at: 'test',
    };
    const result = await repo.create(data);
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it('findByDeployment', async () => {
    const repo = new SolutionConversationRepository();
    const result = await repo.findByDeployment();
    expect(Array.isArray(result)).toBe(true);
  });

  it('findByOrg', async () => {
    const repo = new SolutionConversationRepository();
    const result = await repo.findByOrg();
    expect(Array.isArray(result)).toBe(true);
  });
});
