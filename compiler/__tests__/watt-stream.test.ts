import { describe, it, expect } from 'vitest';
import { generateWattStream } from '../src/generators/watt/stream.gen.js';
import type { StreamDef } from '../src/parsers/stream.parser.js';

describe('Watt stream generator', () => {
  it('generates SSE stream plugin', () => {
    const stream: StreamDef = {
      name: 'alert-feed',
      type: 'sse',
      path: '/streams/alerts',
      description: 'Live alert feed',
    };
    const result = generateWattStream(stream);
    expect(result).toContain("app.get('/streams/alerts'");
    expect(result).toContain('text/event-stream');
    expect(result).toContain('fastify-plugin');
    expect(result).not.toContain('as any');
  });

  it('generates WebSocket stream plugin', () => {
    const stream: StreamDef = {
      name: 'chat-stream',
      type: 'websocket',
      path: '/ws/chat',
    };
    const result = generateWattStream(stream);
    expect(result).toContain('websocket: true');
    expect(result).toContain("app.get('/ws/chat'");
  });
});
