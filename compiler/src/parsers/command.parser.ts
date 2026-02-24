import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { validateSchema } from '../validators/schema.validator.js';
import { commandSchema } from '../schemas/command.schema.js';

export interface CommandDef {
  name: string;
  description?: string;
  args?: Array<{ name: string; type: string; required?: boolean; description?: string }>;
  options?: Array<{ name: string; type: string; default?: unknown; description?: string }>;
  action: { call: string; with?: Record<string, string> };
}

export const parseCommand = (filePath: string): CommandDef => {
  const content = readFileSync(filePath, 'utf-8');
  const data = yaml.load(content) as CommandDef;
  validateSchema(data, commandSchema, filePath);
  return data;
};
