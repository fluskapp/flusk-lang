import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { validateSchema } from '../validators/schema.validator.js';
import { eventSchema } from '../schemas/event.schema.js';

export interface EventPayloadField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'json' | 'date';
  required?: boolean;
  description?: string;
}

export interface EventPublishRule {
  trigger: string;
  transform?: Record<string, string>;
}

export interface EventSubscribe {
  handler: string;
  retry?: { maxAttempts: number; backoff: 'linear' | 'exponential' };
  deadLetter?: string;
}

export interface EventDef {
  name: string;
  description?: string;
  channel: 'kafka' | 'redis' | 'webhook' | 'sse' | 'websocket';
  topic?: string;
  url?: string;
  payload?: { fields: EventPayloadField[] };
  publish?: EventPublishRule[];
  subscribe?: EventSubscribe;
}

export const parseEvent = (filePath: string): EventDef => {
  const content = readFileSync(filePath, 'utf-8');
  const data = yaml.load(content) as EventDef;
  validateSchema(data, eventSchema, filePath);
  return data;
};
