/**
 * Simple exploders for types that need minimal transformation:
 * function, event, worker, client, middleware, command, view, widget
 */

import yaml from 'js-yaml';
import type { FeatureNode } from '../ast/feature.js';
import type { ExplodedFile } from './types.js';
import { toKebab, toCamel } from '../utils/naming.js';

const dump = (obj: unknown): string =>
  yaml.dump(obj, { lineWidth: 120, noRefs: true, quotingType: '"' });

export const explodeFunction = (fn: FeatureNode['functions'][0]): ExplodedFile => {
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

export const explodeEvent = (event: FeatureNode['events'][0]): ExplodedFile => ({
  path: `events/${toKebab(event.name)}.event.yaml`,
  content: dump({
    name: event.name,
    payload: event.payload,
    triggers: event.triggers?.map((t) => ({ [t.type]: t.target })),
  }),
  type: 'event',
});

export const explodeWorker = (worker: FeatureNode['workers'][0]): ExplodedFile => ({
  path: `workers/${toKebab(worker.name)}.worker.yaml`,
  content: dump({
    name: worker.name,
    concurrency: worker.concurrency ?? 1,
    retry: worker.retry,
    steps: worker.steps.map((s) => ({ [s.type]: s.target })),
  }),
  type: 'worker',
});

export const explodeClient = (client: FeatureNode['clients'][0]): ExplodedFile => {
  const endpoints = client.methods.map((m) => ({
    name: m.name,
    method: m.method.toUpperCase(),
    path: m.path,
    ...(m.body ? { input: Object.keys(m.body).map((k) => ({ name: k, type: 'string' })) } : {}),
  }));

  const auth = client.auth ? {
    type: client.auth.type,
    envVar: client.auth.token?.startsWith('$')
      ? client.auth.token.slice(1).toUpperCase()
      : `${toKebab(client.name).toUpperCase().replace(/-/g, '_')}_TOKEN`,
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

export const explodeMiddleware = (mw: FeatureNode['middleware'][0]): ExplodedFile => ({
  path: `middlewares/${toKebab(mw.name)}.middleware.yaml`,
  content: dump(mw),
  type: 'middleware',
});

export const explodeCommand = (cmd: FeatureNode['commands'][0]): ExplodedFile => ({
  path: `commands/${toKebab(cmd.name)}.command.yaml`,
  content: dump(cmd),
  type: 'command',
});

export const explodeView = (view: FeatureNode['views'][0]): ExplodedFile => ({
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
});

export const explodeWidget = (widget: FeatureNode['widgets'][0]): ExplodedFile => ({
  path: `widgets/${toKebab(widget.name)}.widget.yaml`,
  content: dump({
    name: widget.name,
    category: 'custom',
    props: widget.props,
    template: widget.template,
  }),
  type: 'widget',
});
