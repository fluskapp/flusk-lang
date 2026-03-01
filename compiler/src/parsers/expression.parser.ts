/**
 * Expression Parser — converts string expressions into Expression AST nodes
 *
 * Handles: literals, variables, property access, binary/unary ops,
 * function calls, object literals, array literals
 */

import type { Expression } from '../ast/logic.js';

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

export const parseExpressionValue = (raw: unknown): Expression => {
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

/** Split on delimiter respecting brackets/quotes */
export const splitTopLevel = (str: string, delimiter: string): string[] => {
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
