import { describe, it, expect } from 'vitest';
import { WebhookConfigRepository } from '../src/entities/webhookConfig.repository.js';

describe('WebhookConfig Entity', () => {
  it('creates a webhookConfig', async () => {
    const repo = new WebhookConfigRepository();
    const data = {
      bot_id: 'test-bot_id',
      verify_token: 'test-verify_token',
      api_secret: 'test-api_secret',
      provider: 'waha',
      webhook_url: 'test-webhook_url',
    };
    const result = await repo.create(data);
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it('findByBot', async () => {
    const repo = new WebhookConfigRepository();
    const result = await repo.findByBot();
    expect(Array.isArray(result)).toBe(true);
  });
});
