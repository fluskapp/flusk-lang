export const entitySchema = {
  type: 'object',
  required: ['name', 'fields'],
  additionalProperties: false,
  properties: {
    name: { type: 'string', pattern: '^[A-Z][a-zA-Z0-9]+$' },
    description: { type: 'string' },
    storage: { type: 'string', enum: ['postgres', 'mongo', 'memory'] },
    fields: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['name', 'type'],
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          type: { type: 'string', enum: ['string', 'number', 'boolean', 'enum', 'json', 'date'] },
          required: { type: 'boolean' },
          unique: { type: 'boolean' },
          default: {},
          description: { type: 'string' },
          values: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    capabilities: {
      type: 'array',
      items: { type: 'string', enum: ['crud', 'search', 'pagination', 'soft-delete', 'timestamps'] },
    },
  },
} as const;
