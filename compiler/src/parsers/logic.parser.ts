/**
 * Logic DSL Parser — converts YAML `logic:` arrays into LogicBlock AST
 *
 * Syntax examples:
 *   - set: slug = slugify(input.org_name)
 *   - assert: !db.findOne(organization, { slug }), 409, "Exists"
 *   - if: !tool
 *     then: [...]
 *     else: [...]
 *   - map: span in input.spans
 *     steps: [...]
 *   - emit: org-created, { org_id: org.id }
 *   - return: { token, org }
 *   - db.insert: entity, { field: value }
 *   - db.findOne: entity, { where }
 */

import type {
  LogicBlock, LogicNode, Expression,
  SetNode, AssertNode, IfNode, MapNode,
  EmitNode, ReturnNode, DbCallNode, PrimitiveCallNode,
} from '../ast/logic.js';
import { parseExpression, parseExpressionValue, splitTopLevel } from './expression.parser.js';

export { parseExpression } from './expression.parser.js';

export const parseLogicBlock = (raw: unknown[]): LogicBlock => {
  const steps = raw.map((item) => parseStep(item));
  return { steps };
};

const parseStep = (raw: unknown): LogicNode => {
  if (typeof raw === 'string') {
    return parseStringStep(raw);
  }
  if (typeof raw === 'object' && raw !== null) {
    return parseObjectStep(raw as Record<string, unknown>);
  }
  throw new Error(`Invalid logic step: ${JSON.stringify(raw)}`);
};

const parseStringStep = (raw: string): LogicNode => {
  const trimmed = raw.trim();

  if (trimmed.startsWith('set:')) return parseSet(trimmed.slice(4).trim());
  if (trimmed.startsWith('assert:')) return parseAssert(trimmed.slice(7).trim());
  if (trimmed.startsWith('emit:')) return parseEmit(trimmed.slice(5).trim());
  if (trimmed.startsWith('return:')) return parseReturn(trimmed.slice(7).trim());

  const dbMatch = trimmed.match(/^(db\.\w+):\s*(.+)$/);
  if (dbMatch) return parseDbCall(dbMatch[1]!, dbMatch[2]!);

  const callMatch = trimmed.match(/^(\w[\w.]*)\((.*)?\)$/);
  if (callMatch) return parsePrimitiveCall(callMatch[1]!, callMatch[2] ?? '');

  if (trimmed.includes('=') && !trimmed.startsWith('=')) return parseSet(trimmed);

  throw new Error(`Cannot parse logic step: "${trimmed}"`);
};

const parseObjectStep = (raw: Record<string, unknown>): LogicNode => {
  if ('set' in raw && typeof raw.set === 'string') return parseSet(raw.set);

  if ('assert' in raw) {
    const condition = parseExpression(String(raw.assert));
    const statusCode = typeof raw.status === 'number' ? raw.status : 400;
    const message = typeof raw.message === 'string' ? raw.message : 'Assertion failed';
    return { kind: 'assert', condition, statusCode, message } as AssertNode;
  }

  if ('if' in raw) {
    const condition = parseExpression(String(raw.if));
    const thenSteps = Array.isArray(raw.then) ? raw.then.map(parseStep) : [];
    const elseSteps = Array.isArray(raw.else) ? raw.else.map(parseStep) : undefined;
    return { kind: 'if', condition, then: thenSteps, else: elseSteps } as IfNode;
  }

  if ('map' in raw && typeof raw.map === 'string') {
    const mapMatch = raw.map.match(/^(\w+)\s+in\s+(.+)$/);
    if (!mapMatch) throw new Error(`Invalid map syntax: "${raw.map}"`);
    const variable = mapMatch[1]!;
    const collection = parseExpression(mapMatch[2]!);
    const steps = Array.isArray(raw.steps) ? raw.steps.map(parseStep) : [];
    return { kind: 'map', variable, collection, steps } as MapNode;
  }

  if ('emit' in raw && typeof raw.emit === 'string') {
    if (raw.payload && typeof raw.payload === 'object') {
      const payload: Record<string, Expression> = {};
      for (const [k, v] of Object.entries(raw.payload as Record<string, unknown>)) {
        payload[k] = parseExpression(String(v));
      }
      return { kind: 'emit', event: raw.emit, payload } as EmitNode;
    }
    return parseEmit(raw.emit);
  }

  if ('return' in raw) {
    const value = typeof raw.return === 'string'
      ? parseExpression(raw.return)
      : parseExpressionValue(raw.return);
    return { kind: 'return', value } as ReturnNode;
  }

  for (const key of Object.keys(raw)) {
    if (key.startsWith('db.')) return parseDbCall(key, String(raw[key]));
  }

  throw new Error(`Cannot parse logic object: ${JSON.stringify(raw)}`);
};

// --- Step Parsers ---

const parseSet = (raw: string): SetNode => {
  const eqIdx = raw.indexOf('=');
  if (eqIdx === -1) throw new Error(`Invalid set: "${raw}" (missing =)`);
  const variable = raw.slice(0, eqIdx).trim();
  const expr = raw.slice(eqIdx + 1).trim();
  if (expr.startsWith('=')) throw new Error(`Invalid set: "${raw}" (use == for comparison)`);
  return { kind: 'set', variable, expression: parseExpression(expr) };
};

const parseAssert = (raw: string): AssertNode => {
  const parts = splitTopLevel(raw, ',');
  if (parts.length < 2) throw new Error(`Invalid assert: "${raw}"`);
  const condition = parseExpression(parts[0]!);
  const statusCode = parseInt(parts[1]!.trim(), 10) || 400;
  const message = parts[2] ? parts[2].trim().replace(/^["']|["']$/g, '') : 'Assertion failed';
  return { kind: 'assert', condition, statusCode, message };
};

const parseEmit = (raw: string): EmitNode => {
  const commaIdx = raw.indexOf(',');
  if (commaIdx === -1) return { kind: 'emit', event: raw.trim(), payload: {} };
  const event = raw.slice(0, commaIdx).trim();
  const payloadStr = raw.slice(commaIdx + 1).trim();
  const payloadExpr = parseExpression(payloadStr);
  const payload: Record<string, Expression> = {};
  if (payloadExpr.type === 'object') Object.assign(payload, payloadExpr.properties);
  return { kind: 'emit', event, payload };
};

const parseReturn = (raw: string): ReturnNode => {
  return { kind: 'return', value: parseExpression(raw.trim()) };
};

const parseDbCall = (op: string, raw: string): DbCallNode => {
  const dbOp = op.replace('db.', '') as DbCallNode['op'];
  const parts = splitTopLevel(raw.trim(), ',');
  const entity = parts[0]!.trim();
  const paramStr = parts.slice(1).join(',').trim();
  const paramsExpr = paramStr ? parseExpression(paramStr) : { type: 'object' as const, properties: {} };
  const params: Record<string, Expression> = paramsExpr.type === 'object' ? paramsExpr.properties : {};
  return { kind: 'db', op: dbOp, entity, params };
};

const parsePrimitiveCall = (name: string, argsStr: string): PrimitiveCallNode => {
  const args = argsStr.trim()
    ? splitTopLevel(argsStr, ',').map((a) => parseExpression(a))
    : [];
  return { kind: 'primitive', name, args };
};
