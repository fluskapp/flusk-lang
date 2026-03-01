/**
 * DB operation emitter — generates Platformatic entity API calls
 */

import type { DbCallNode, PrimitiveCallNode } from '../../ast/logic.js';
import { toCamel } from '../../utils/naming.js';
import { emitExpr } from './expr-emitter.js';

const toEntityName = toCamel;

/** Emit DB operation as statement */
export const emitDbCall = (node: DbCallNode): string => {
  const entity = toEntityName(node.entity);
  const params = Object.entries(node.params)
    .map(([k, v]) => `${k}: ${emitExpr(v)}`);
  const paramsStr = params.length > 0 ? `{ ${params.join(', ')} }` : '{}';

  switch (node.op) {
    case 'find':
      return `await app.platformatic.entities.${entity}.find({ where: ${paramsStr} })`;
    case 'findOne':
      return `await app.platformatic.entities.${entity}.find({ where: ${paramsStr}, limit: 1 }).then(r => r[0] ?? null)`;
    case 'insert':
    case 'update':
      return `await app.platformatic.entities.${entity}.save({ input: ${paramsStr} })`;
    case 'delete':
      return `await app.platformatic.entities.${entity}.delete({ where: ${paramsStr} })`;
    case 'count':
      return `await app.platformatic.entities.${entity}.count({ where: ${paramsStr} })`;
    default:
      return `/* unknown db op: ${node.op} */`;
  }
};

/** Emit primitive call as statement */
export const emitPrimitive = (node: PrimitiveCallNode): string => {
  return emitExpr({ type: 'call', name: node.name, args: node.args });
};
