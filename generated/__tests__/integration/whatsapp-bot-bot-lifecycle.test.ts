import { describe, it, expect, beforeAll } from 'vitest';
import { createServer } from '../helpers/server.js';

describe('whatsapp-bot — bot-lifecycle', () => {
  let app: Awaited<ReturnType<typeof createServer>>;

  beforeAll(async () => {
    app = await createServer();
  });

  it('bot-lifecycle', async () => {
    // Auth: session
    const token = 'test-token';

    const res = await app.inject({
      method: 'POST',
      url: '/api/bots',
      payload: {"name":"Test Bot","phone_number":"+1234567890","system_prompt":"You are helpful"},
    });
    expect(res.statusCode).toBe(200);

    const res = await app.inject({
      method: 'GET',
      url: '/api/bots',
    });
    expect(res.statusCode).toBe(200);

    // Assert: bots.length > 0
    // TODO: implement assertion

  });
});
