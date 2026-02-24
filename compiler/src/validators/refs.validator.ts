import type { EntityDef } from '../parsers/entity.parser.js';
import type { FunctionDef } from '../parsers/function.parser.js';
import type { RouteDef } from '../parsers/route.parser.js';
import type { CommandDef } from '../parsers/command.parser.js';
import type { ServiceDef } from '../parsers/service.parser.js';
import type { MiddlewareDef } from '../parsers/middleware.parser.js';
import type { PluginDef } from '../parsers/plugin.parser.js';

export class RefValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Reference validation failed:\n${issues.map((i) => `  - ${i}`).join('\n')}`);
    this.name = 'RefValidationError';
  }
}

interface AllDefs {
  entities: EntityDef[];
  functions: FunctionDef[];
  routes: RouteDef[];
  commands: CommandDef[];
  services?: ServiceDef[];
  middlewares?: MiddlewareDef[];
  plugins?: PluginDef[];
}

export const validateRefs = (defs: AllDefs): void => {
  const issues: string[] = [];
  const entityNames = new Set(defs.entities.map((e) => e.name));
  const functionNames = new Set(defs.functions.map((f) => f.name));
  const middlewareNames = new Set((defs.middlewares ?? []).map((m) => m.name));

  for (const fn of defs.functions) {
    for (const input of fn.inputs ?? []) {
      const baseType = input.type.replace(/\[\]$/, '');
      if (/^[A-Z]/.test(baseType) && baseType !== 'Database' && !entityNames.has(baseType)) {
        issues.push(`Function "${fn.name}" input "${input.name}" references unknown entity "${baseType}"`);
      }
    }
    for (const step of fn.steps) {
      if (step.call && !functionNames.has(step.call)) {
        issues.push(`Function "${fn.name}" step "${step.id}" calls unknown function "${step.call}"`);
      }
    }
  }

  for (const route of defs.routes) {
    if (route.entity && !entityNames.has(route.entity)) {
      issues.push(`Route "${route.name}" references unknown entity "${route.entity}"`);
    }
    for (const op of route.operations) {
      if (!functionNames.has(op.call)) {
        issues.push(`Route "${route.name}" operation "${op.method} ${op.path}" calls unknown function "${op.call}"`);
      }
    }
  }

  for (const cmd of defs.commands) {
    if (!functionNames.has(cmd.action.call)) {
      issues.push(`Command "${cmd.name}" calls unknown function "${cmd.action.call}"`);
    }
  }

  for (const svc of defs.services ?? []) {
    for (const mw of svc.middleware ?? []) {
      if (!middlewareNames.has(mw)) {
        issues.push(`Service "${svc.name}" references unknown middleware "${mw}"`);
      }
    }
    if (svc.capture?.entity && !entityNames.has(svc.capture.entity)) {
      issues.push(`Service "${svc.name}" capture references unknown entity "${svc.capture.entity}"`);
    }
  }

  for (const mw of defs.middlewares ?? []) {
    if (mw.output) {
      for (const val of Object.values(mw.output)) {
        if (/^[A-Z]/.test(val) && !entityNames.has(val)) {
          issues.push(`Middleware "${mw.name}" output references unknown entity "${val}"`);
        }
      }
    }
  }

  if (issues.length > 0) throw new RefValidationError(issues);
};
