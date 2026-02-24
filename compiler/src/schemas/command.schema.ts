export const commandSchema = {
  type: 'object',
  required: ['name', 'action'],
  additionalProperties: false,
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
    args: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'type'],
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
          required: { type: 'boolean' },
          description: { type: 'string' },
        },
      },
    },
    options: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'type'],
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
          default: {},
          description: { type: 'string' },
        },
      },
    },
    action: {
      type: 'object',
      required: ['call'],
      properties: {
        call: { type: 'string' },
        with: { type: 'object', additionalProperties: { type: 'string' } },
      },
    },
  },
} as const;
