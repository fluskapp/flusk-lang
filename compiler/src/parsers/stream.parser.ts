import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { validateSchema } from '../validators/schema.validator.js';
import { streamSchema } from '../schemas/stream.schema.js';

export interface StreamSource {
  entity?: string;
  query?: Record<string, unknown>;
  interval?: string;
  realtime?: boolean;
}

export interface StreamDef {
  name: string;
  description?: string;
  type: 'sse' | 'websocket' | 'grpc';
  path: string;
  source?: StreamSource;
  transform?: { fields: Record<string, string> };
  auth?: 'required' | 'optional' | 'none';
}

export const parseStream = (filePath: string): StreamDef => {
  const content = readFileSync(filePath, 'utf-8');
  const data = yaml.load(content) as StreamDef;
  validateSchema(data, streamSchema, filePath);
  return data;
};
