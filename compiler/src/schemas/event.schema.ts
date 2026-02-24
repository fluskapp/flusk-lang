const payloadFieldSchema = {
  type: 'object',
  required: ['name', 'type'],
  additionalProperties: false,
  properties: {
    name: { type: 'string' },
    type: { type: 'string', enum: ['string', 'number', 'boolean', 'json', 'date'] },
    required: { type: 'boolean' },
    description: { type: 'string' },
  },
};

export const eventSchema = {
  type: 'object',
  required: ['name', 'channel'],
  additionalProperties: false,
  properties: {
    name: { type: 'string', pattern: '^[A-Z][a-zA-Z0-9]+$' },
    description: { type: 'string' },
    channel: { type: 'string', enum: ['kafka', 'redis', 'webhook', 'sse', 'websocket'] },
    topic: { type: 'string' },
    url: { type: 'string' },
    payload: {
      type: 'object',
      properties: {
        fields: { type: 'array', items: payloadFieldSchema },
      },
    },
    publish: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          trigger: { type: 'string' },
          transform: { type: 'object', additionalProperties: { type: 'string' } },
        },
      },
    },
    subscribe: {
      type: 'object',
      properties: {
        handler: { type: 'string' },
        retry: {
          type: 'object',
          properties: {
            maxAttempts: { type: 'number' },
            backoff: { type: 'string', enum: ['linear', 'exponential'] },
          },
        },
        deadLetter: { type: 'string' },
      },
    },
  },
} as const;
