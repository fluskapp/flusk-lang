/**
 * Expression Emitter — converts Logic DSL expressions to TypeScript code
 */

import type { Expression } from '../../ast/logic.js';
import { toCamel, escStr } from '../../utils/naming.js';

/** Known enum-like bare words that should be quoted as strings */
const KNOWN_ENUMS = new Set([
  'active', 'inactive', 'trial', 'suspended', 'draft', 'testing', 'published', 'archived',
  'owner', 'admin', 'member', 'viewer', 'anonymous',
  'pending', 'sent', 'failed', 'processing', 'ready', 'error',
  'open', 'acknowledged', 'resolved', 'dismissed',
  'healthy', 'degraded', 'down', 'unknown', 'removed', 'paused', 'revoked',
  'invited', 'disabled', 'offline',
  'chat', 'coding', 'image', 'voice', 'search', 'other',
  'low', 'medium', 'high', 'critical',
  'email', 'slack', 'webhook', 'whatsapp', 'telegram', 'teams', 'desktop',
  'openclaw', 'custom', 'openai', 'anthropic', 'google',
  'file', 'url', 'text', 'api',
  'starter', 'growth', 'enterprise',
  'connected', 'disconnected',
  'in', 'out',
]);

/** Map of entity names (kebab) to Platformatic table names (camelCase) */
const toEntityName = toCamel;

export const emitExpr = (expr: Expression): string => {
  switch (expr.type) {
    case 'literal':
      if (expr.value === null) return 'null';
      if (typeof expr.value === 'string') return `'${escStr(expr.value)}'`;
      return String(expr.value);

    case 'variable':
      if (KNOWN_ENUMS.has(expr.name)) return `'${expr.name}'`;
      return expr.name;

    case 'property':
      return `${emitExpr(expr.object)}.${expr.property}`;

    case 'call':
      return emitCallExpr(expr.name, expr.args);

    case 'binary':
      return `(${emitExpr(expr.left)} ${expr.op} ${emitExpr(expr.right)})`;

    case 'unary':
      return `${expr.op}(${emitExpr(expr.operand)})`;

    case 'object': {
      const props = Object.entries(expr.properties)
        .map(([k, v]) => {
          const val = emitExpr(v);
          return val === k ? k : `${k}: ${val}`;
        });
      return `{ ${props.join(', ')} }`;
    }

    case 'array':
      return `[${expr.elements.map(emitExpr).join(', ')}]`;

    case 'template':
      return '`' + expr.parts.map((p) =>
        typeof p === 'string' ? p : `\${${emitExpr(p)}}`
      ).join('') + '`';

    default:
      return '/* unknown expression */';
  }
};

/** Emit function call expressions — maps DSL names to real code */
const emitCallExpr = (name: string, args: Expression[]): string => {
  const a = args.map(emitExpr);

  switch (name) {
    case 'hash': return `await bcrypt.hash(${a[0]}, 10)`;
    case 'verify': return `await bcrypt.compare(${a[0]}, ${a[1]})`;
    case 'jwt.sign': return `app.jwt.sign(${a[0]})`;
    case 'jwt.verify': return `app.jwt.verify(${a[0]})`;
    case 'apikey.generate': return `nanoid(${a[0] ?? 32})`;
    case 'slugify': return `slugify(${a[0]})`;
    case 'now': return `new Date().toISOString()`;
    case 'crypto.randomUUID': return `randomUUID()`;
    case 'crypto.hash': return `createHash('sha256').update(${a[0]}).digest('hex')`;

    case 'db.findOne': {
      const entity = a[0]?.replace(/'/g, '');
      return `await app.platformatic.entities.${toEntityName(entity ?? '')}.find({ where: ${a[1] ?? '{}'}, limit: 1 }).then(r => r[0] ?? null)`;
    }
    case 'db.find': {
      const entity = a[0]?.replace(/'/g, '');
      return `await app.platformatic.entities.${toEntityName(entity ?? '')}.find({ where: ${a[1] ?? '{}'} })`;
    }
    case 'db.insert':
    case 'db.update': {
      const entity = a[0]?.replace(/'/g, '');
      return `await app.platformatic.entities.${toEntityName(entity ?? '')}.save({ input: ${a[1] ?? '{}'} })`;
    }
    case 'db.delete': {
      const entity = a[0]?.replace(/'/g, '');
      return `await app.platformatic.entities.${toEntityName(entity ?? '')}.delete({ where: ${a[1] ?? '{}'} })`;
    }
    case 'db.count': {
      const entity = a[0]?.replace(/'/g, '');
      return `await app.platformatic.entities.${toEntityName(entity ?? '')}.count({ where: ${a[1] ?? '{}'} })`;
    }

    default:
      return `${name}(${a.join(', ')})`;
  }
};
