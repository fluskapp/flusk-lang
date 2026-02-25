import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { validateSchema } from '../validators/schema.validator.js';
import { hookSchema } from '../schemas/hook.schema.js';

export interface HookLifecycle {
  event: 'preSave' | 'postSave' | 'preDelete' | 'postDelete' | 'preFind' | 'postFind';
  call?: string;
  with?: Record<string, unknown>;
}

export interface HookDef {
  name: string;
  description?: string;
  entity: string;
  lifecycle: HookLifecycle[];
}

export const parseHook = (filePath: string): HookDef => {
  const content = readFileSync(filePath, 'utf-8');
  const data = yaml.load(content) as HookDef;
  validateSchema(data, hookSchema, filePath);
  return data;
};
