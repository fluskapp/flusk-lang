import yaml from 'js-yaml';
import type { FeatureNode } from '../ast/feature.js';
import type { ExplodedFile } from './types.js';
import { toKebab, toPascal, toCamel } from '../utils/naming.js';

const dump = (obj: unknown): string =>
  yaml.dump(obj, { lineWidth: 120, noRefs: true, quotingType: '"' });

export const explodeRoutes = (
  routes: FeatureNode['routes'],
  feature: string,
  fnNames: Set<string>,
): { routeFile: ExplodedFile; handlerFiles: ExplodedFile[] } => {
  const basePath = `/api/${toKebab(feature)}`;

  const operations = routes.map((r) => {
    const callName = toCamel(r.name);
    const op: Record<string, unknown> = {
      method: r.method,
      path: r.path.startsWith('/') ? r.path : `/${r.path}`,
      call: callName,
    };
    if (r.input?.length) op.input = r.input[0]?.name;
    if (r.auth) op.auth = r.auth;
    return { op, callName, route: r };
  });

  const handlerFiles = operations
    .filter((o) => !fnNames.has(o.callName))
    .map((o): ExplodedFile => {
      const steps: Record<string, unknown>[] = [];
      for (const action of o.route.actions ?? []) {
        if (action.type === 'create' || action.type === 'update' || action.type === 'delete') {
          steps.push({ id: `${action.type}${toPascal(action.target)}`, call: `${toPascal(action.target)}.${action.type}` });
        } else if (action.type === 'emit') {
          steps.push({ id: `emit${toPascal(action.target)}`, action: 'call', source: toCamel(action.target) });
        } else if (action.type === 'validate') {
          steps.push({ id: `validate${toPascal(action.target)}`, action: 'validate', source: action.target });
        } else {
          steps.push({ id: `${action.type}${toPascal(action.target)}`, action: 'call', source: action.target });
        }
      }
      if (steps.length === 0) {
        steps.push({ id: 'handle', action: 'return', value: { ok: true } });
      }
      return {
        path: `functions/${toKebab(o.callName)}.function.yaml`,
        content: dump({
          name: o.callName,
          description: `Handler for ${o.route.method} ${o.route.path}`,
          inputs: (o.route.input ?? []).map((i) => ({ name: i.name, type: i.type })),
          output: o.route.response ? { type: 'object' } : { type: 'void' },
          steps,
        }),
        type: 'function',
      };
    });

  return {
    routeFile: {
      path: `routes/${toKebab(feature)}.route.yaml`,
      content: dump({ name: toKebab(feature), basePath, operations: operations.map((o) => o.op) }),
      type: 'route',
    },
    handlerFiles,
  };
};
