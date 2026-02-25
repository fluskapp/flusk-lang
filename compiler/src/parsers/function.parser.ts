import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { validateSchema } from '../validators/schema.validator.js';
import { functionSchema } from '../schemas/function.schema.js';

export interface FunctionStep {
  id: string;
  call?: string;
  action?: string;
  with?: Record<string, unknown>;
  source?: string;
  where?: { field: string; op: string; value: unknown };
  onError?: string;
}

export interface FunctionDef {
  name: string;
  description?: string;
  inputs?: Array<{ name: string; type: string }>;
  output?: { type: string };
  steps: FunctionStep[];
  errors?: Array<{ type: string; action: string }>;
}

export const parseFunction = (filePath: string): FunctionDef => {
  const content = readFileSync(filePath, 'utf-8');
  const data = yaml.load(content) as FunctionDef;
  validateSchema(data, functionSchema, filePath);
  return data;
};
