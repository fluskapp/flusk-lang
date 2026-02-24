const inputSchema = {
  type: 'object',
  required: ['name', 'from'],
  properties: {
    name: { type: 'string' },
    from: { type: 'string' },
  },
};

const stepSchema = {
  type: 'object',
  required: ['id', 'action'],
  properties: {
    id: { type: 'string' },
    action: { type: 'string', enum: ['assign', 'call', 'return'] },
    value: {},
  },
};

export const middlewareSchema = {
  type: 'object',
  required: ['name', 'phase'],
  additionalProperties: false,
  properties: {
    name: { type: 'string', pattern: '^[a-z][a-z0-9-]+$' },
    description: { type: 'string' },
    phase: { type: 'string', enum: ['request', 'response', 'error'] },
    inputs: { type: 'array', items: inputSchema },
    output: { type: 'object', additionalProperties: { type: 'string' } },
    lookup: { type: 'object' },
    steps: { type: 'array', items: stepSchema },
  },
} as const;
