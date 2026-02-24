const stepSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string' },
    call: { type: 'string' },
    action: { type: 'string' },
    with: { type: 'object', additionalProperties: { type: 'string' } },
    source: { type: 'string' },
    onError: { type: 'string' },
  },
};

export const workerSchema = {
  type: 'object',
  required: ['name', 'type'],
  additionalProperties: false,
  properties: {
    name: { type: 'string', pattern: '^[A-Z][a-zA-Z0-9]+$' },
    description: { type: 'string' },
    type: { type: 'string', enum: ['temporal-workflow', 'bullmq', 'cron'] },
    schedule: { type: 'string' },
    queue: { type: 'string' },
    taskQueue: { type: 'string' },
    steps: { type: 'array', items: stepSchema },
    retry: {
      type: 'object',
      properties: {
        maxAttempts: { type: 'number' },
        backoff: { type: 'string', enum: ['linear', 'exponential'] },
      },
    },
    timeout: { type: 'string' },
  },
} as const;
