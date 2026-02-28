import { describe, it, expect } from 'vitest';
import { MessageRepository } from '../src/entities/message.repository.js';

describe('Message Entity', () => {
  it('creates a message', async () => {
    const repo = new MessageRepository();
    const data = {
      conversation_id: 'test-conversation_id',
      role: 'user',
      content: 'test-content',
      tokens_used: 1,
      cost: 'test',
      latency_ms: 1,
    };
    const result = await repo.create(data);
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it('findByConversation', async () => {
    const repo = new MessageRepository();
    const result = await repo.findByConversation();
    expect(Array.isArray(result)).toBe(true);
  });

  it('countByBot', async () => {
    const repo = new MessageRepository();
    const result = await repo.countByBot();
    expect(Array.isArray(result)).toBe(true);
  });
});
