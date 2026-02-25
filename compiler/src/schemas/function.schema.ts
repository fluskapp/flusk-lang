const stepSchema = {
  type: 'object',
  required: ['id'],
  additionalProperties: true,
  properties: {
    id: { type: 'string' },
    call: { type: 'string' },
    action: {
      type: 'string',
      enum: ['call', 'filter', 'forEach', 'map', 'validate', 'transform', 'condition', 'assign', 'return'],
    },
    with: { type: 'object', additionalProperties: true },
    source: { type: 'string' },
    store: { type: 'string' },
    description: { type: 'string' },
    where: {
      type: 'object',
      additionalProperties: true,
      properties: {
        field: { type: 'string' },
        op: { type: 'string' },
        value: {},
      },
    },
    if: { type: 'object', additionalProperties: true },
    then: { type: 'array', items: { type: 'object', additionalProperties: true } },
    else: { type: 'array', items: { type: 'object', additionalProperties: true } },
    transform: { type: 'object', additionalProperties: true },
    value: {},
    onError: { type: 'string' },
  },
};

export const functionSchema = {
  type: 'object',
  required: ['name'],
  additionalProperties: true,
  properties: {
    name: { type: 'string', pattern: '^[a-z][a-zA-Z0-9]+$' },
    description: { type: 'string' },
    inputs: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'type'],
        additionalProperties: true,
        properties: { name: { type: 'string' }, type: { type: 'string' }, description: { type: 'string' } },
      },
    },
    output: {
      type: 'object',
      additionalProperties: true,
      properties: { type: { type: 'string' } },
    },
    steps: { type: 'array', minItems: 1, items: stepSchema },
    errors: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        properties: { type: { type: 'string' }, action: { type: 'string' } },
      },
    },
  },
} as const;
