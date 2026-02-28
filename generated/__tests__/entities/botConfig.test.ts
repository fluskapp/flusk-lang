import { describe, it, expect } from 'vitest';
import { BotConfigRepository } from '../src/entities/botConfig.repository.js';

describe('BotConfig Entity', () => {
  it('creates a botConfig', async () => {
    const repo = new BotConfigRepository();
    const data = {
      workspace_id: 'test-workspace_id',
      bot_token: 'test-bot_token',
      active: true,
    };
    const result = await repo.create(data);
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it('findByWorkspace', async () => {
    const repo = new BotConfigRepository();
    const result = await repo.findByWorkspace();
    expect(Array.isArray(result)).toBe(true);
  });
});
