export const hookSchema = {
  type: 'object',
  required: ['name', 'entity', 'lifecycle'],
  additionalProperties: false,
  properties: {
    name: { type: 'string', pattern: '^[a-z][a-zA-Z0-9]+$' },
    description: { type: 'string' },
    entity: { type: 'string', pattern: '^[A-Z][a-zA-Z0-9]+$' },
    lifecycle: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['event'],
        additionalProperties: false,
        properties: {
          event: {
            type: 'string',
            enum: ['preSave', 'postSave', 'preDelete', 'postDelete', 'preFind', 'postFind'],
          },
          call: { type: 'string' },
          with: { type: 'object', additionalProperties: true },
        },
      },
    },
  },
} as const;
