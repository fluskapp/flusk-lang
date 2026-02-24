import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { validateSchema } from '../validators/schema.validator.js';
import { clientSchema } from '../schemas/client.schema.js';

export interface ClientEndpoint {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  input?: Array<{ name: string; type: string; required?: boolean }>;
  output?: { type: string };
  retry?: { maxAttempts: number; backoff: 'linear' | 'exponential' };
  timeout?: number;
}

export interface ClientDef {
  name: string;
  description?: string;
  baseUrl: string;
  auth?: {
    type: 'bearer' | 'header' | 'query';
    envVar: string;
    headerName?: string;
    queryParam?: string;
  };
  endpoints: ClientEndpoint[];
}

export const parseClient = (filePath: string): ClientDef => {
  const content = readFileSync(filePath, 'utf-8');
  const data = yaml.load(content) as ClientDef;
  validateSchema(data, clientSchema, filePath);
  return data;
};
