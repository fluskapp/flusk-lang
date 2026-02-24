import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { validateSchema } from '../validators/schema.validator.js';
import { routeSchema } from '../schemas/route.schema.js';

export interface RouteDef {
  name: string;
  basePath: string;
  entity?: string;
  auth?: 'required' | 'optional' | 'none';
  operations: Array<{
    method: string;
    path: string;
    call: string;
    input?: string;
    description?: string;
  }>;
}

export const parseRoute = (filePath: string): RouteDef => {
  const content = readFileSync(filePath, 'utf-8');
  const data = yaml.load(content) as RouteDef;
  validateSchema(data, routeSchema, filePath);
  return data;
};
