import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { validateSchema } from '../validators/schema.validator.js';
import { workerSchema } from '../schemas/worker.schema.js';

export interface WorkerStep {
  id: string;
  call?: string;
  action?: string;
  with?: Record<string, string>;
  source?: string;
  onError?: string;
}

export interface WorkerDef {
  name: string;
  description?: string;
  type: 'temporal-workflow' | 'bullmq' | 'cron';
  schedule?: string;
  queue?: string;
  taskQueue?: string;
  steps?: WorkerStep[];
  retry?: { maxAttempts: number; backoff: 'linear' | 'exponential' };
  timeout?: string;
}

export const parseWorker = (filePath: string): WorkerDef => {
  const content = readFileSync(filePath, 'utf-8');
  const data = yaml.load(content) as WorkerDef;
  validateSchema(data, workerSchema, filePath);
  return data;
};
