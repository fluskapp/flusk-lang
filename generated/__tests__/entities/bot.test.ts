import { describe, it, expect } from 'vitest';
import { BotRepository } from '../src/entities/bot.repository.js';

describe('Bot Entity', () => {
  it('creates a bot', async () => {
    const repo = new BotRepository();
    const data = {
      name: 'test-name',
      phone_number: 'test-phone_number',
      system_prompt: 'test-system_prompt',
      model: 'gpt-4o',
      temperature: 'test',
      max_tokens: 1,
      active: true,
      owner_id: 'test-owner_id',
    };
    const result = await repo.create(data);
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it('findByOwner', async () => {
    const repo = new BotRepository();
    const result = await repo.findByOwner();
    expect(Array.isArray(result)).toBe(true);
  });

  it('findByPhone', async () => {
    const repo = new BotRepository();
    const result = await repo.findByPhone();
    expect(Array.isArray(result)).toBe(true);
  });

  it('findActive', async () => {
    const repo = new BotRepository();
    const result = await repo.findActive();
    expect(Array.isArray(result)).toBe(true);
  });
});
