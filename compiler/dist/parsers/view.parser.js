import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { validateSchema } from '../validators/schema.validator.js';
import { viewSchema } from '../schemas/view.schema.js';
export const parseView = (filePath) => {
    const content = readFileSync(filePath, 'utf-8');
    const data = yaml.load(content);
    validateSchema(data, viewSchema, filePath);
    return data;
};
