import { describe, it, expect } from 'vitest';
import { BotMessageRepository } from '../src/entities/botMessage.repository.js';

describe('BotMessage Entity', () => {
  it('creates a botMessage', async () => {
    const repo = new BotMessageRepository();
    const data = {
      slack_ts: 'test-slack_ts',
      channel: 'test-channel',
      text: 'test-text',
      status: 'pending',
    };
    const result = await repo.create(data);
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it('findPending', async () => {
    const repo = new BotMessageRepository();
    const result = await repo.findPending();
    expect(Array.isArray(result)).toBe(true);
  });
});
