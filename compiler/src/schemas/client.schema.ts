const endpointSchema = {
  type: 'object',
  required: ['name', 'method', 'path'],
  additionalProperties: false,
  properties: {
    name: { type: 'string' },
    method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
    path: { type: 'string', pattern: '^/' },
    input: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'type'],
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
          required: { type: 'boolean' },
        },
      },
    },
    output: {
      type: 'object',
      properties: { type: { type: 'string' } },
    },
    retry: {
      type: 'object',
      properties: {
        maxAttempts: { type: 'number' },
        backoff: { type: 'string', enum: ['linear', 'exponential'] },
      },
    },
    timeout: { type: 'number' },
  },
};

export const clientSchema = {
  type: 'object',
  required: ['name', 'baseUrl', 'endpoints'],
  additionalProperties: false,
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
    baseUrl: { type: 'string' },
    auth: {
      type: 'object',
      required: ['type', 'envVar'],
      properties: {
        type: { type: 'string', enum: ['bearer', 'header', 'query'] },
        envVar: { type: 'string' },
        headerName: { type: 'string' },
        queryParam: { type: 'string' },
      },
    },
    endpoints: { type: 'array', minItems: 1, items: endpointSchema },
  },
} as const;
