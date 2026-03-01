import type { ValidateFunction } from 'ajv';
import _Ajv from 'ajv';

// AJV ESM/CJS interop — runtime default is the Ajv class constructor
interface AjvInstance { compile(schema: object): ValidateFunction; }
const AjvClass = _Ajv as unknown as new (opts: { allErrors: boolean }) => AjvInstance;
const ajv = new AjvClass({ allErrors: true });

export class SchemaValidationError extends Error {
  constructor(
    public readonly filePath: string,
    public readonly errors: Array<{ path: string; message: string }>,
  ) {
    const details = errors.map((e) => `  ${e.path}: ${e.message}`).join('\n');
    super(`Schema validation failed for ${filePath}:\n${details}`);
    this.name = 'SchemaValidationError';
  }
}

export const validateSchema = (data: unknown, schema: object, filePath: string): void => {
  const validate = ajv.compile(schema);
  if (!validate(data)) {
    const errors = ((validate.errors ?? []) as Array<{ instancePath: string; message?: string }>).map((e: { instancePath: string; message?: string }) => ({
      path: e.instancePath || '/',
      message: e.message ?? 'unknown error',
    }));
    throw new SchemaValidationError(filePath, errors);
  }
};
