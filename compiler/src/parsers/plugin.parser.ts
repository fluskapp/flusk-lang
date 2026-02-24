import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { validateSchema } from '../validators/schema.validator.js';
import { pluginSchema } from '../schemas/plugin.schema.js';

export interface HookAction {
  action: string;
  name?: string;
  attributes?: Record<string, string>;
}

export interface PluginDecorator {
  name: string;
  type: 'function' | 'object' | 'string';
}

export interface PluginDef {
  name: string;
  description?: string;
  type: 'fastify-plugin' | 'decorator' | 'hook';
  hooks?: Record<string, HookAction[]>;
  decorators?: PluginDecorator[];
  options?: Record<string, unknown>;
}

export const parsePlugin = (filePath: string): PluginDef => {
  const content = readFileSync(filePath, 'utf-8');
  const data = yaml.load(content) as PluginDef;
  validateSchema(data, pluginSchema, filePath);
  return data;
};
