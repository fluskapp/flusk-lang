import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { validateSchema } from '../validators/schema.validator.js';
import { providerSchema } from '../schemas/provider.schema.js';

export interface ProviderDef {
  name: string;
  description?: string;
  type: 'webhook' | 'rest' | 'graphql' | 'grpc' | 'smtp';
  config?: {
    fields: Array<{ name: string; type: string; required?: boolean; description?: string }>;
  };
  methods: Array<{ name: string; description?: string; input?: string; template?: string }>;
}

export const parseProvider = (filePath: string): ProviderDef => {
  const content = readFileSync(filePath, 'utf-8');
  const data = yaml.load(content) as ProviderDef;
  validateSchema(data, providerSchema, filePath);
  return data;
};
