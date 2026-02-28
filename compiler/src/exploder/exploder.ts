/**
 * Exploder — FeatureNode → sub-YAML file map
 *
 * Maps feature sections to individual YAML files that match
 * existing parsers: entity, function, command, route, event,
 * worker, client, middleware, view, widget
 */

import yaml from 'js-yaml';
import type { FeatureNode } from '../ast/feature.js';

export interface ExplodedFile {
  path: string;
  content: string;
  type: string;
}

export interface ExplodedFiles {
  files: ExplodedFile[];
  feature: string;
}

const toKebab = (s: string): string =>
  s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase().replace(/[_ ]+/g, '-');

const toPascal = (s: string): string =>
  s.split(/[-_ ]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');

const toCamel = (s: string): string => {
  const pascal = toPascal(s);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

const dump = (obj: unknown): string =>
  yaml.dump(obj, { lineWidth: 120, noRefs: true, quotingType: '"' });

// ── Entity exploder ────────────────────────────

const explodeEntity = (entity: FeatureNode['entities'][0], feature: string): ExplodedFile => {
  const name = toPascal(entity.name);
  const fields = entity.fields.map((f) => {
    const field: Record<string, unknown> = { name: f.name, type: f.type };
    if (f.required) field.required = true;
    if (f.unique) field.unique = true;
    if (f.indexed) field.index = true;
    if (f.encrypted) field.description = `encrypted: ${f.description ?? f.name}`;
    if (f.nullable) field.required = false;
    if (f.default !== undefined) field.default = f.default;
    if (f.values) field.values = f.values;
    if (f.description) field.description = f.description;
    return field;
  });

  const queries = entity.queries?.map((q) => {
    if (q.by) return { name: q.name, sql: `SELECT * FROM ${toKebab(entity.name)} WHERE ${q.by} = ?` };
    if (q.where) {
      let sql = `SELECT * FROM ${toKebab(entity.name)} WHERE ${q.where}`;
      if (q.order) sql += ` ORDER BY ${q.order}`;
      if (q.limit) sql += ` LIMIT ${q.limit}`;
      return { name: q.name, sql };
    }
    return { name: q.name, sql: `SELECT * FROM ${toKebab(entity.name)}` };
  });

  const obj: Record<string, unknown> = { name, description: entity.description, fields };
  if (queries?.length) obj.queries = queries;
  if (entity.relations?.length) {
    obj.relations = entity.relations.map((r) => ({
      entity: toPascal(r.entity), type: r.type, foreignKey: r.foreignKey ?? `${toKebab(r.entity)}_id`,
    }));
  }
  if (entity.capabilities?.length) obj.capabilities = entity.capabilities;

  return {
    path: `entities/${toKebab(entity.name)}.entity.yaml`,
    content: dump(obj),
    type: 'entity',
  };
};

// ── Route exploder ─────────────────────────────

const explodeRoutes = (routes: FeatureNode['routes'], feature: string, fnNames: Set<string>): { routeFile: ExplodedFile; handlerFiles: ExplodedFile[] } => {
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

  // Auto-generate handler functions for routes without matching functions
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

// ── Function exploder ──────────────────────────

const explodeFunction = (fn: FeatureNode['functions'][0]): ExplodedFile => {
  const camelName = toCamel(fn.name);
  const steps: Record<string, unknown>[] = [];
  if (fn.uses) {
    steps.push({ id: 'callExternal', call: fn.uses });
  }
  if (fn.steps) {
    for (const s of fn.steps) {
      const [type, target] = s.includes(':') ? s.split(':').map((x) => x.trim()) : ['call', s];
      steps.push({ id: toCamel(target), action: type === 'call' ? 'call' : 'return', source: target });
    }
  }
  if (steps.length === 0) {
    steps.push({ id: 'execute', action: 'return', value: { ok: true } });
  }

  return {
    path: `functions/${toKebab(fn.name)}.function.yaml`,
    content: dump({
      name: camelName,
      description: fn.description,
      inputs: fn.input.map((i) => ({ name: i.name, type: i.type })),
      output: fn.output ?? { type: 'object' },
      steps,
    }),
    type: 'function',
  };
};

// ── Event exploder ─────────────────────────────

const explodeEvent = (event: FeatureNode['events'][0]): ExplodedFile => {
  return {
    path: `events/${toKebab(event.name)}.event.yaml`,
    content: dump({
      name: event.name,
      payload: event.payload,
      triggers: event.triggers?.map((t) => ({ [t.type]: t.target })),
    }),
    type: 'event',
  };
};

// ── Worker exploder ────────────────────────────

const explodeWorker = (worker: FeatureNode['workers'][0]): ExplodedFile => {
  return {
    path: `workers/${toKebab(worker.name)}.worker.yaml`,
    content: dump({
      name: worker.name,
      concurrency: worker.concurrency ?? 1,
      retry: worker.retry,
      steps: worker.steps.map((s) => ({ [s.type]: s.target })),
    }),
    type: 'worker',
  };
};

// ── Client exploder ────────────────────────────

const explodeClient = (client: FeatureNode['clients'][0]): ExplodedFile => {
  const endpoints = client.methods.map((m) => ({
    name: m.name,
    method: m.method.toUpperCase(),
    path: m.path,
    ...(m.body ? { input: Object.keys(m.body).map((k) => ({ name: k, type: 'string' })) } : {}),
  }));

  const auth = client.auth ? {
    type: client.auth.type,
    envVar: client.auth.token?.startsWith('$') ? client.auth.token.slice(1).toUpperCase() : `${toKebab(client.name).toUpperCase().replace(/-/g, '_')}_TOKEN`,
  } : undefined;

  return {
    path: `clients/${toKebab(client.name)}.client.yaml`,
    content: dump({
      name: client.name,
      baseUrl: client.base_url,
      ...(auth ? { auth } : {}),
      endpoints,
    }),
    type: 'client',
  };
};

// ── Middleware exploder ────────────────────────

const explodeMiddleware = (mw: FeatureNode['middleware'][0]): ExplodedFile => {
  return {
    path: `middlewares/${toKebab(mw.name)}.middleware.yaml`,
    content: dump(mw),
    type: 'middleware',
  };
};

// ── Command exploder ───────────────────────────

const explodeCommand = (cmd: FeatureNode['commands'][0]): ExplodedFile => {
  return {
    path: `commands/${toKebab(cmd.name)}.command.yaml`,
    content: dump(cmd),
    type: 'command',
  };
};

// ── View exploder ──────────────────────────────

const explodeView = (view: FeatureNode['views'][0]): ExplodedFile => {
  return {
    path: `views/${toKebab(view.name)}.view.yaml`,
    content: dump({
      name: view.name,
      type: 'page',
      route: view.route,
      title: view.title,
      loader: view.loader,
      sections: view.sections,
    }),
    type: 'view',
  };
};

// ── Widget exploder ────────────────────────────

const explodeWidget = (widget: FeatureNode['widgets'][0]): ExplodedFile => {
  return {
    path: `widgets/${toKebab(widget.name)}.widget.yaml`,
    content: dump({
      name: widget.name,
      category: 'custom',
      props: widget.props,
      template: widget.template,
    }),
    type: 'widget',
  };
};

// ── Main exploder ──────────────────────────────

export const explodeFeature = (feature: FeatureNode): ExplodedFiles => {
  const files: ExplodedFile[] = [];

  for (const entity of feature.entities) {
    files.push(explodeEntity(entity, feature.name));
  }

  const fnNames = new Set(feature.functions.map((f) => toCamel(f.name)));

  if (feature.routes.length > 0) {
    const { routeFile, handlerFiles } = explodeRoutes(feature.routes, feature.name, fnNames);
    files.push(routeFile);
    files.push(...handlerFiles);
  }

  for (const fn of feature.functions) {
    files.push(explodeFunction(fn));
  }

  for (const event of feature.events) {
    files.push(explodeEvent(event));
  }

  for (const worker of feature.workers) {
    files.push(explodeWorker(worker));
  }

  for (const client of feature.clients) {
    files.push(explodeClient(client));
  }

  for (const mw of feature.middleware) {
    files.push(explodeMiddleware(mw));
  }

  for (const cmd of feature.commands) {
    files.push(explodeCommand(cmd));
  }

  for (const view of feature.views) {
    files.push(explodeView(view));
  }

  for (const widget of feature.widgets) {
    files.push(explodeWidget(widget));
  }

  return { files, feature: feature.name };
};
