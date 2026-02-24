const providerSchema = {
  type: 'object',
  required: ['name', 'baseUrl'],
  properties: {
    name: { type: 'string' },
    baseUrl: { type: 'string' },
    pathPrefix: { type: 'string' },
    detect: { type: 'array', items: { type: 'string' } },
  },
};

export const serviceSchema = {
  type: 'object',
  required: ['name', 'type', 'listen'],
  additionalProperties: false,
  properties: {
    name: { type: 'string', pattern: '^[a-z][a-z0-9-]+$' },
    description: { type: 'string' },
    type: { type: 'string', enum: ['http-proxy', 'http-server', 'collector', 'worker'] },
    listen: {
      type: 'object',
      required: ['port'],
      properties: {
        port: { type: 'number' },
        host: { type: 'string' },
      },
    },
    upstream: {
      type: 'object',
      properties: {
        providers: { type: 'array', items: providerSchema },
      },
    },
    middleware: { type: 'array', items: { type: 'string' } },
    capture: {
      type: 'object',
      properties: {
        entity: { type: 'string' },
        async: { type: 'boolean' },
        fields: { type: 'object', additionalProperties: { type: 'string' } },
      },
    },
    streaming: { type: 'boolean' },
  },
} as const;
