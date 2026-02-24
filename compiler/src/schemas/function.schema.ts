const stepSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string' },
    call: { type: 'string' },
    action: {
      type: 'string',
      enum: ['call', 'filter', 'forEach', 'map', 'validate', 'transform', 'condition', 'assign', 'return'],
    },
    with: { type: 'object', additionalProperties: { type: 'string' } },
    source: { type: 'string' },
    where: {
      type: 'object',
      properties: {
        field: { type: 'string' },
        op: { type: 'string', enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'contains'] },
        value: {},
      },
    },
    onError: { type: 'string' },
  },
};

export const functionSchema = {
  type: 'object',
  required: ['name', 'steps'],
  additionalProperties: false,
  properties: {
    name: { type: 'string', pattern: '^[a-z][a-zA-Z0-9]+$' },
    description: { type: 'string' },
    inputs: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'type'],
        properties: { name: { type: 'string' }, type: { type: 'string' } },
      },
    },
    output: {
      type: 'object',
      properties: { type: { type: 'string' } },
    },
    steps: { type: 'array', minItems: 1, items: stepSchema },
    errors: {
      type: 'array',
      items: {
        type: 'object',
        properties: { type: { type: 'string' }, action: { type: 'string' } },
      },
    },
  },
} as const;
