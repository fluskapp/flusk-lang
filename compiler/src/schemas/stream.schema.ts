export const streamSchema = {
  type: 'object',
  required: ['name', 'type', 'path'],
  additionalProperties: false,
  properties: {
    name: { type: 'string', pattern: '^[A-Z][a-zA-Z0-9]+$' },
    description: { type: 'string' },
    type: { type: 'string', enum: ['sse', 'websocket', 'grpc'] },
    path: { type: 'string', pattern: '^/' },
    source: {
      type: 'object',
      properties: {
        entity: { type: 'string' },
        query: { type: 'object', additionalProperties: true },
        interval: { type: 'string' },
        realtime: { type: 'boolean' },
      },
    },
    transform: {
      type: 'object',
      properties: {
        fields: { type: 'object', additionalProperties: { type: 'string' } },
      },
    },
    auth: { type: 'string', enum: ['required', 'optional', 'none'] },
  },
} as const;
