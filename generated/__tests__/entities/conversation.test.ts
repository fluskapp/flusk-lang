import { describe, it, expect } from 'vitest';
import { ConversationRepository } from '../src/entities/conversation.repository.js';

describe('Conversation Entity', () => {
  it('creates a conversation', async () => {
    const repo = new ConversationRepository();
    const data = {
      bot_id: 'test-bot_id',
      contact_phone: 'test-contact_phone',
      contact_name: 'test-contact_name',
      status: 'active',
      last_message_at: 'test',
    };
    const result = await repo.create(data);
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it('findByBot', async () => {
    const repo = new ConversationRepository();
    const result = await repo.findByBot();
    expect(Array.isArray(result)).toBe(true);
  });

  it('findByContact', async () => {
    const repo = new ConversationRepository();
    const result = await repo.findByContact();
    expect(Array.isArray(result)).toBe(true);
  });
});
