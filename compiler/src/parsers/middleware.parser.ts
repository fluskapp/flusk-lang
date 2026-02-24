import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { validateSchema } from '../validators/schema.validator.js';
import { middlewareSchema } from '../schemas/middleware.schema.js';

export interface MiddlewareInput {
  name: string;
  from: string;
}

export interface MiddlewareStep {
  id: string;
  action: 'assign' | 'call' | 'return';
  value?: unknown;
}

export interface MiddlewareDef {
  name: string;
  description?: string;
  phase: 'request' | 'response' | 'error';
  inputs?: MiddlewareInput[];
  output?: Record<string, string>;
  lookup?: Record<string, unknown>;
  steps?: MiddlewareStep[];
}

export const parseMiddleware = (filePath: string): MiddlewareDef => {
  const content = readFileSync(filePath, 'utf-8');
  const data = yaml.load(content) as MiddlewareDef;
  validateSchema(data, middlewareSchema, filePath);
  return data;
};
