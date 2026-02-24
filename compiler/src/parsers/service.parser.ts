import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { validateSchema } from '../validators/schema.validator.js';
import { serviceSchema } from '../schemas/service.schema.js';

export interface UpstreamProvider {
  name: string;
  baseUrl: string;
  pathPrefix?: string;
  detect?: string[];
}

export interface ServiceDef {
  name: string;
  description?: string;
  type: 'http-proxy' | 'http-server' | 'collector' | 'worker';
  listen: { port: number; host?: string };
  upstream?: { providers: UpstreamProvider[] };
  middleware?: string[];
  capture?: { entity?: string; async?: boolean; fields?: Record<string, string> };
  streaming?: boolean;
}

export const parseService = (filePath: string): ServiceDef => {
  const content = readFileSync(filePath, 'utf-8');
  const data = yaml.load(content) as ServiceDef;
  validateSchema(data, serviceSchema, filePath);
  return data;
};
