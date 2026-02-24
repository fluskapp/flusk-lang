import _Ajv from 'ajv';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Ajv = _Ajv as any;
const ajv = new Ajv({ allErrors: true });

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
