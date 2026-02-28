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

  // set: var = expr
  if (trimmed.startsWith('set:')) {
    return parseSet(trimmed.slice(4).trim());
  }

  // assert: condition, code, message
  if (trimmed.startsWith('assert:')) {
    return parseAssert(trimmed.slice(7).trim());
  }

  // emit: event, payload
  if (trimmed.startsWith('emit:')) {
    return parseEmit(trimmed.slice(5).trim());
  }

  // return: value
  if (trimmed.startsWith('return:')) {
    return parseReturn(trimmed.slice(7).trim());
  }

  // db.op: entity, params
  const dbMatch = trimmed.match(/^(db\.\w+):\s*(.+)$/);
  if (dbMatch) {
    return parseDbCall(dbMatch[1]!, dbMatch[2]!);
  }

  // Primitive calls: hash(...), jwt.sign(...), etc.
  const callMatch = trimmed.match(/^(\w[\w.]*)\((.*)?\)$/);
  if (callMatch) {
    return parsePrimitiveCall(callMatch[1]!, callMatch[2] ?? '');
  }

  // Fallback: treat as set without prefix
  if (trimmed.includes('=') && !trimmed.startsWith('=')) {
    return parseSet(trimmed);
  }

  throw new Error(`Cannot parse logic step: "${trimmed}"`);
};

const parseObjectStep = (raw: Record<string, unknown>): LogicNode => {
  // { set: "var = expr" }
  if ('set' in raw && typeof raw.set === 'string') {
    return parseSet(raw.set);
  }

  // { assert: "condition", status: 409, message: "..." }
  if ('assert' in raw) {
    const condition = parseExpression(String(raw.assert));
    const statusCode = typeof raw.status === 'number' ? raw.status : 400;
    const message = typeof raw.message === 'string' ? raw.message : 'Assertion failed';
    return { kind: 'assert', condition, statusCode, message } as AssertNode;
  }

  // { if: "condition", then: [...], else: [...] }
  if ('if' in raw) {
    const condition = parseExpression(String(raw.if));
    const thenSteps = Array.isArray(raw.then) ? raw.then.map(parseStep) : [];
    const elseSteps = Array.isArray(raw.else) ? raw.else.map(parseStep) : undefined;
    return { kind: 'if', condition, then: thenSteps, else: elseSteps } as IfNode;
  }

  // { map: "item in collection", steps: [...] }
  if ('map' in raw && typeof raw.map === 'string') {
    const mapMatch = raw.map.match(/^(\w+)\s+in\s+(.+)$/);
    if (!mapMatch) throw new Error(`Invalid map syntax: "${raw.map}"`);
    const variable = mapMatch[1]!;
    const collection = parseExpression(mapMatch[2]!);
    const steps = Array.isArray(raw.steps) ? raw.steps.map(parseStep) : [];
    return { kind: 'map', variable, collection, steps } as MapNode;
  }

  // { emit: "event-name", payload: {...} } or { emit: "event, { payload }" }
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

  // { return: value }
  if ('return' in raw) {
    const value = typeof raw.return === 'string'
      ? parseExpression(raw.return)
      : parseExpressionValue(raw.return);
    return { kind: 'return', value } as ReturnNode;
  }

  // { "db.findOne": "entity, { where }" }
  for (const key of Object.keys(raw)) {
    if (key.startsWith('db.')) {
      return parseDbCall(key, String(raw[key]));
    }
  }

  throw new Error(`Cannot parse logic object: ${JSON.stringify(raw)}`);
};

// --- Expression Parser ---

export const parseExpression = (raw: string): Expression => {
  const trimmed = raw.trim();

  // Null
  if (trimmed === 'null') {
    return { type: 'literal', value: null };
  }

  // Boolean
  if (trimmed === 'true') return { type: 'literal', value: true };
  if (trimmed === 'false') return { type: 'literal', value: false };

  // Number
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return { type: 'literal', value: Number(trimmed) };
  }

  // String literal
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return { type: 'literal', value: trimmed.slice(1, -1) };
  }

  // Unary !
  if (trimmed.startsWith('!')) {
    return { type: 'unary', op: '!', operand: parseExpression(trimmed.slice(1)) };
  }

  // Object literal { key: value, ... }
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return parseObjectExpression(trimmed);
  }

  // Array literal [a, b, c]
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1).trim();
    const elements = inner ? splitTopLevel(inner, ',').map((e) => parseExpression(e)) : [];
    return { type: 'array', elements };
  }

  // Binary operators (??, &&, ||, ==, !=, >=, <=, >, <)
  for (const op of ['??', '&&', '||', '!=', '==', '>=', '<=', '>', '<'] as const) {
    const parts = splitTopLevel(trimmed, op);
    if (parts.length === 2) {
      return { type: 'binary', op, left: parseExpression(parts[0]!), right: parseExpression(parts[1]!) };
    }
  }

  // Function call: name(args)
  const callMatch = trimmed.match(/^([\w.]+)\((.*)?\)$/s);
  if (callMatch) {
    const args = callMatch[2]
      ? splitTopLevel(callMatch[2], ',').map((a) => parseExpression(a))
      : [];
    return { type: 'call', name: callMatch[1]!, args };
  }

  // Property access: a.b.c or a["key"]
  if (trimmed.includes('.') && !trimmed.includes('(')) {
    const parts = trimmed.split('.');
    let expr: Expression = { type: 'variable', name: parts[0]! };
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i]!;
      // Handle bracket notation like attributes["key"]
      const bracketMatch = part.match(/^(\w+)\["(.+)"\]$/);
      if (bracketMatch) {
        expr = { type: 'property', object: expr, property: bracketMatch[1]! };
        expr = { type: 'property', object: expr, property: bracketMatch[2]! };
      } else {
        expr = { type: 'property', object: expr, property: part };
      }
    }
    return expr;
  }

  // Simple variable
  return { type: 'variable', name: trimmed };
};

const parseObjectExpression = (raw: string): Expression => {
  const inner = raw.slice(1, -1).trim();
  if (!inner) return { type: 'object', properties: {} };

  const properties: Record<string, Expression> = {};
  const parts = splitTopLevel(inner, ',');

  for (const part of parts) {
    const colonIdx = part.indexOf(':');
    if (colonIdx === -1) {
      // Shorthand: { slug } means { slug: slug }
      const name = part.trim();
      properties[name] = { type: 'variable', name };
    } else {
      const key = part.slice(0, colonIdx).trim();
      const value = part.slice(colonIdx + 1).trim();
      properties[key] = parseExpression(value);
    }
  }

  return { type: 'object', properties };
};

const parseExpressionValue = (raw: unknown): Expression => {
  if (typeof raw === 'string') return parseExpression(raw);
  if (typeof raw === 'number') return { type: 'literal', value: raw };
  if (typeof raw === 'boolean') return { type: 'literal', value: raw };
  if (raw === null) return { type: 'literal', value: null };
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const properties: Record<string, Expression> = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      properties[k] = parseExpressionValue(v);
    }
    return { type: 'object', properties };
  }
  return { type: 'literal', value: String(raw) };
};

// --- Step Parsers ---

const parseSet = (raw: string): SetNode => {
  const eqIdx = raw.indexOf('=');
  if (eqIdx === -1) throw new Error(`Invalid set: "${raw}" (missing =)`);
  const variable = raw.slice(0, eqIdx).trim();
  const expr = raw.slice(eqIdx + 1).trim();
  // Handle == by checking for double =
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
  if (commaIdx === -1) {
    return { kind: 'emit', event: raw.trim(), payload: {} };
  }
  const event = raw.slice(0, commaIdx).trim();
  const payloadStr = raw.slice(commaIdx + 1).trim();
  const payloadExpr = parseExpression(payloadStr);
  const payload: Record<string, Expression> = {};
  if (payloadExpr.type === 'object') {
    Object.assign(payload, payloadExpr.properties);
  }
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

// --- Utility: split on delimiter respecting brackets/quotes ---

const splitTopLevel = (str: string, delimiter: string): string[] => {
  const results: string[] = [];
  let current = '';
  let depth = 0;
  let inString: string | null = null;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i]!;

    if (inString) {
      current += ch;
      if (ch === inString && str[i - 1] !== '\\') inString = null;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = ch;
      current += ch;
      continue;
    }

    if (ch === '(' || ch === '{' || ch === '[') { depth++; current += ch; continue; }
    if (ch === ')' || ch === '}' || ch === ']') { depth--; current += ch; continue; }

    if (depth === 0 && str.slice(i, i + delimiter.length) === delimiter) {
      results.push(current);
      current = '';
      i += delimiter.length - 1;
      continue;
    }

    current += ch;
  }

  if (current.trim()) results.push(current);
  return results;
};
