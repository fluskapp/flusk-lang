const hookActionSchema = {
  type: 'object',
  required: ['action'],
  properties: {
    action: { type: 'string' },
    name: { type: 'string' },
    attributes: { type: 'object', additionalProperties: { type: 'string' } },
  },
};

const decoratorSchema = {
  type: 'object',
  required: ['name', 'type'],
  properties: {
    name: { type: 'string' },
    type: { type: 'string', enum: ['function', 'object', 'string'] },
  },
};

export const pluginSchema = {
  type: 'object',
  required: ['name', 'type'],
  additionalProperties: false,
  properties: {
    name: { type: 'string', pattern: '^[a-z][a-z0-9-]+$' },
    description: { type: 'string' },
    type: { type: 'string', enum: ['fastify-plugin', 'decorator', 'hook'] },
    hooks: {
      type: 'object',
      additionalProperties: { type: 'array', items: hookActionSchema },
    },
    decorators: { type: 'array', items: decoratorSchema },
    options: { type: 'object' },
  },
} as const;
