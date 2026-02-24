export const routeSchema = {
  type: 'object',
  required: ['name', 'basePath', 'operations'],
  additionalProperties: false,
  properties: {
    name: { type: 'string' },
    basePath: { type: 'string', pattern: '^/' },
    entity: { type: 'string' },
    auth: { type: 'string', enum: ['required', 'optional', 'none'] },
    operations: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['method', 'path', 'call'],
        properties: {
          method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
          path: { type: 'string' },
          call: { type: 'string' },
          input: { type: 'string' },
          description: { type: 'string' },
        },
      },
    },
  },
} as const;
