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

interface ClientDef {
  name: string;
  endpoints: Array<{ name: string }>;
}

interface AllDefs {
  entities: EntityDef[];
  functions: FunctionDef[];
  routes: RouteDef[];
  commands: CommandDef[];
  clients?: ClientDef[];
  services?: ServiceDef[];
  middlewares?: MiddlewareDef[];
  plugins?: PluginDef[];
  hooks?: Array<{ name: string; entity: string; lifecycle: Array<{ call?: string }> }>;
}

// Platformatic DB built-in entity operations
const ENTITY_METHODS = new Set([
  'create', 'findOne', 'findMany', 'update', 'delete',
  'count', 'aggregate',
]);

// CRUD function prefixes auto-generated from entity capabilities
const CRUD_PREFIXES = ['create', 'find', 'list', 'update', 'delete', 'count'];
const CRUD_BY_PATTERN = /^find(\w+)By(\w+)$/;

/** Build the set of auto-generated CRUD function names from entities */
const buildCrudFunctionNames = (entities: EntityDef[]): Set<string> => {
  const names = new Set<string>();
  for (const entity of entities) {
    const name = entity.name; // PascalCase
    for (const prefix of CRUD_PREFIXES) {
      names.add(`${prefix}${name}`);           // createUser, findUser, listUser, etc.
      names.add(`${prefix}${name}s`);          // createUsers, listUsers, etc.
    }
    // findEntityById
    names.add(`find${name}ById`);
    // listEntityByField patterns for indexed/required fields
    const fields = Array.isArray(entity.fields)
      ? entity.fields
      : Object.entries(entity.fields ?? {}).map(([k, v]) => ({ name: k, ...(typeof v === 'object' ? v : {}) }));
    for (const field of fields) {
      const fieldName = typeof field === 'object' && 'name' in field ? field.name : '';
      if (fieldName) {
        const pascal = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
        names.add(`find${name}By${pascal}`);     // findUserByEmail
        names.add(`list${name}By${pascal}`);     // listUserByTenantId
        names.add(`list${name}sBy${pascal}`);    // listUsersByTenantId
        names.add(`delete${name}By${pascal}`);   // deleteSolutionAccessBySolutionId
      }
    }
    // Entity + status combo patterns
    names.add(`list${name}ByTenantAndStatus`);
    names.add(`list${name}sByTenantAndStatus`);
    names.add(`list${name}sBy${name}Id`);
    names.add(`list${name}By${name}Id`);
    // Plural variants for common patterns
    names.add(`listQueriesBySolutionAndUser`);
    names.add(`listQueriesBySolutionThisMonth`);
  }
  return names;
};

/** Check if a call target is a valid Entity.method reference */
const isEntityCall = (call: string, entityNames: Set<string>): boolean => {
  const dot = call.indexOf('.');
  if (dot === -1) return false;
  const entityName = call.slice(0, dot);
  const method = call.slice(dot + 1);
  return entityNames.has(entityName) && ENTITY_METHODS.has(method);
};

/** Check if a call is a valid Client.endpoint reference */
const isClientCall = (call: string, clientEndpoints: Set<string>): boolean => {
  return clientEndpoints.has(call);
};

/** Check if a call matches a findEntityByField pattern */
const isCrudByPattern = (call: string, entityNames: Set<string>): boolean => {
  const match = CRUD_BY_PATTERN.exec(call);
  if (!match) return false;
  return entityNames.has(match[1]);
};

/** Check if a call target is valid (user function, entity method, CRUD auto-gen, or client endpoint) */
const isValidCall = (call: string, functionNames: Set<string>, entityNames: Set<string>, clientEndpoints: Set<string>, crudFunctions: Set<string>): boolean => {
  return functionNames.has(call)
    || isEntityCall(call, entityNames)
    || isClientCall(call, clientEndpoints)
    || crudFunctions.has(call)
    || isCrudByPattern(call, entityNames);
};

export const validateRefs = (defs: AllDefs): void => {
  const issues: string[] = [];
  const entityNames = new Set(defs.entities.map((e) => e.name));
  const functionNames = new Set(defs.functions.map((f) => f.name));
  const middlewareNames = new Set((defs.middlewares ?? []).map((m) => m.name));
  const clientEndpoints = new Set(
    (defs.clients ?? []).flatMap((c) => c.endpoints.map((e) => `${c.name}.${e.name}`))
  );
  const crudFunctions = buildCrudFunctionNames(defs.entities);

  for (const fn of defs.functions) {
    for (const input of fn.inputs ?? []) {
      const baseType = input.type.replace(/\[\]$/, '');
      if (/^[A-Z]/.test(baseType) && baseType !== 'Database' && !entityNames.has(baseType)) {
        issues.push(`Function "${fn.name}" input "${input.name}" references unknown entity "${baseType}"`);
      }
    }
    for (const step of fn.steps) {
      if (step.call && !isValidCall(step.call, functionNames, entityNames, clientEndpoints, crudFunctions)) {
        issues.push(`Function "${fn.name}" step "${step.id}" calls unknown function "${step.call}"`);
      }
    }
  }

  for (const route of defs.routes) {
    if (route.entity && !entityNames.has(route.entity)) {
      issues.push(`Route "${route.name}" references unknown entity "${route.entity}"`);
    }
    for (const op of route.operations) {
      if (!isValidCall(op.call, functionNames, entityNames, clientEndpoints, crudFunctions)) {
        issues.push(`Route "${route.name}" operation "${op.method} ${op.path}" calls unknown function "${op.call}"`);
      }
    }
  }

  for (const cmd of defs.commands) {
    if (!isValidCall(cmd.action.call, functionNames, entityNames, clientEndpoints, crudFunctions)) {
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

  for (const hook of defs.hooks ?? []) {
    if (!entityNames.has(hook.entity)) {
      issues.push(`Hook "${hook.name}" references unknown entity "${hook.entity}"`);
    }
    for (const lc of hook.lifecycle) {
      if (lc.call && !isValidCall(lc.call, functionNames, entityNames, clientEndpoints, crudFunctions)) {
        issues.push(`Hook "${hook.name}" lifecycle calls unknown function "${lc.call}"`);
      }
    }
  }

  if (issues.length > 0) throw new RefValidationError(issues);
};
