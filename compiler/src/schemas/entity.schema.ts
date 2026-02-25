export const entitySchema = {
  type: 'object',
  required: ['name', 'fields'],
  additionalProperties: true,
  properties: {
    name: { type: 'string', pattern: '^[A-Z][a-zA-Z0-9]+$' },
    description: { type: 'string' },
    storage: { type: 'string', enum: ['postgres', 'sqlite', 'mongo', 'memory'] },
    fields: {
      oneOf: [
        {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['name', 'type'],
            additionalProperties: true,
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              required: { type: 'boolean' },
              unique: { type: 'boolean' },
              index: { type: 'boolean' },
              default: {},
              description: { type: 'string' },
              values: { type: 'array', items: { type: 'string' } },
            },
          },
        },
        {
          type: 'object',
          minProperties: 1,
          additionalProperties: {
            type: 'object',
            additionalProperties: true,
            properties: {
              type: { type: 'string' },
              required: { type: 'boolean' },
              unique: { type: 'boolean' },
              index: { type: 'boolean' },
              default: {},
              description: { type: 'string' },
              values: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      ],
    },
    capabilities: {
      oneOf: [
        { type: 'array', items: { type: 'string' } },
        { type: 'object', additionalProperties: true },
      ],
    },
    relations: { type: 'array', items: { type: 'object', additionalProperties: true } },
    queries: { type: 'array', items: { type: 'object', additionalProperties: true } },
  },
} as const;
