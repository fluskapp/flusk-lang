import { describe, it, expect, beforeAll } from 'vitest';
import { createServer } from '../helpers/server.js';

describe('whatsapp-bot — webhook-flow', () => {
  let app: Awaited<ReturnType<typeof createServer>>;

  beforeAll(async () => {
    app = await createServer();
  });

  it('webhook-flow', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/webhooks/whatsapp/test-bot-id',
      headers: {"x-webhook-signature":"computed"},
      payload: {"message":{"from":"+1234567890","body":"Hello"}},
    });
    expect(res.statusCode).toBe(200);

    // Wait for worker: process-incoming-message
    await new Promise((r) => setTimeout(r, 100));

    // Assert: messages.count > 0
    // TODO: implement assertion

  });
});
