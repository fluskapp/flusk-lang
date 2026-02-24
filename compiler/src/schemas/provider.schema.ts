export const providerSchema = {
  type: 'object',
  required: ['name', 'type', 'methods'],
  additionalProperties: false,
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
    type: { type: 'string', enum: ['webhook', 'rest', 'graphql', 'grpc', 'smtp'] },
    config: {
      type: 'object',
      properties: {
        fields: {
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
      },
    },
    methods: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          input: { type: 'string' },
          template: { type: 'string' },
        },
      },
    },
  },
} as const;
