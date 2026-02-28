/**
 * Feature Parser — parses .feature.yaml into FeatureNode AST
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { validateSchema } from '../validators/schema.validator.js';
import { featureSchema } from '../schemas/feature.schema.js';
import type {
  FeatureNode, FeatureEntity, FeatureField,
  FeatureRoute, FeatureAction, FeatureFunction,
  FeatureEvent, FeatureTrigger, FeatureWorker,
  FeatureWorkerStep, FeatureClient, FeatureMiddleware,
  FeatureCommand, FeatureView, FeatureWidget,
  FeatureTest, FeatureTestStep, FeatureQuery,
} from '../ast/feature.js';

// ── Normalize helpers ──────────────────────────

const normalizeFields = (fields: unknown): FeatureField[] => {
  if (!fields) return [];
  if (Array.isArray(fields)) return fields as FeatureField[];
  return Object.entries(fields as Record<string, unknown>).map(
    ([name, def]) => ({
      name,
      ...(typeof def === 'object' && def ? def : { type: String(def) }),
    }),
  ) as FeatureField[];
};

const normalizeQueries = (queries: unknown): FeatureQuery[] => {
  if (!queries) return [];
  if (Array.isArray(queries)) {
    return queries.map((q) => {
      if (typeof q === 'string') return { name: q };
      const [name, def] = Object.entries(q)[0] as [string, Record<string, unknown>];
      return { name, ...def } as FeatureQuery;
    });
  }
  return Object.entries(queries as Record<string, unknown>).map(
    ([name, def]) => ({ name, ...(def as object) }),
  ) as FeatureQuery[];
};

const normalizeActions = (actions: unknown): FeatureAction[] => {
  if (!Array.isArray(actions)) return [];
  return actions.map((a) => {
    if (typeof a === 'string') {
      const [type, target] = a.split(':').map((s) => s.trim());
      return { type, target } as FeatureAction;
    }
    const [type, target] = Object.entries(a)[0] as [string, string];
    return { type, target } as FeatureAction;
  });
};

const normalizeTriggers = (triggers: unknown): FeatureTrigger[] => {
  if (!Array.isArray(triggers)) return [];
  return triggers.map((t) => {
    const [type, target] = Object.entries(t)[0] as [string, string];
    return { type, target } as FeatureTrigger;
  });
};

const normalizeSteps = (steps: unknown): FeatureWorkerStep[] => {
  if (!Array.isArray(steps)) return [];
  return steps.map((s) => {
    if (typeof s === 'string') {
      const [type, target] = s.split(':').map((x) => x.trim());
      return { type, target } as FeatureWorkerStep;
    }
    const [type, target] = Object.entries(s)[0] as [string, string];
    return { type, target } as FeatureWorkerStep;
  });
};

const normalizeTestSteps = (steps: unknown): FeatureTestStep[] => {
  if (!Array.isArray(steps)) return [];
  return steps.map((s) => {
    if (typeof s === 'string') return { type: 'assert', condition: s } as FeatureTestStep;
    for (const method of ['post', 'get', 'put', 'delete'] as const) {
      if (method in (s as Record<string, unknown>)) {
        return { type: method, path: (s as Record<string, unknown>)[method], ...s } as FeatureTestStep;
      }
    }
    if ('wait' in (s as Record<string, unknown>)) return { type: 'wait', target: (s as Record<string, string>).wait } as FeatureTestStep;
    if ('assert' in (s as Record<string, unknown>)) return { type: 'assert', condition: (s as Record<string, string>).assert } as FeatureTestStep;
    if ('auth' in (s as Record<string, unknown>)) return { type: 'auth', target: (s as Record<string, string>).auth } as FeatureTestStep;
    return s as FeatureTestStep;
  });
};

// ── Main Parser ────────────────────────────────

const parseFeatureData = (data: Record<string, unknown>): FeatureNode => {
  const entities = ((data.entities ?? []) as Record<string, unknown>[]).map(
    (e): FeatureEntity => ({
      name: e.name as string,
      description: e.description as string | undefined,
      fields: normalizeFields(e.fields),
      queries: normalizeQueries(e.queries),
      relations: (e.relations ?? []) as FeatureEntity['relations'],
      capabilities: e.capabilities as string[] | undefined,
    }),
  );

  const routes = ((data.routes ?? []) as Record<string, unknown>[]).map(
    (r): FeatureRoute => ({
      ...r,
      actions: normalizeActions(r.actions),
    }) as FeatureRoute,
  );

  const functions = ((data.functions ?? []) as Record<string, unknown>[]).map(
    (f) => f as unknown as FeatureFunction,
  );

  const events = ((data.events ?? []) as Record<string, unknown>[]).map(
    (e): FeatureEvent => ({
      name: e.name as string,
      payload: (e.payload ?? []) as FeatureEvent['payload'],
      triggers: normalizeTriggers(e.triggers),
    }),
  );

  const workers = ((data.workers ?? []) as Record<string, unknown>[]).map(
    (w): FeatureWorker => ({
      name: w.name as string,
      concurrency: w.concurrency as number | undefined,
      retry: w.retry as FeatureWorker['retry'],
      steps: normalizeSteps(w.steps),
    }),
  );

  const clients = (data.clients ?? []) as FeatureClient[];
  const middleware = (data.middleware ?? []) as FeatureMiddleware[];
  const commands = (data.commands ?? []) as FeatureCommand[];
  const views = (data.views ?? []) as FeatureView[];
  const widgets = (data.widgets ?? []) as FeatureWidget[];

  const rawTests = (data.tests as Record<string, unknown[]>) ?? {};
  const integration = ((rawTests.integration ?? []) as Record<string, unknown>[]).map(
    (t): FeatureTest => ({
      name: t.name as string,
      steps: normalizeTestSteps(t.steps),
    }),
  );

  return {
    name: data.name as string,
    description: data.description as string | undefined,
    version: data.version as string | undefined,
    entities,
    routes,
    functions,
    events,
    workers,
    clients,
    middleware,
    commands,
    views,
    widgets,
    tests: { integration },
  };
};

export const parseFeature = (filePath: string): FeatureNode => {
  const content = readFileSync(filePath, 'utf-8');
  const data = yaml.load(content) as Record<string, unknown>;
  validateSchema(data, featureSchema, filePath);
  return parseFeatureData(data);
};

export const parseFeatureFromString = (yamlStr: string): FeatureNode => {
  const data = yaml.load(yamlStr) as Record<string, unknown>;
  validateSchema(data, featureSchema, '<string>');
  return parseFeatureData(data);
};

export const loadFeatures = (dir: string): FeatureNode[] => {
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith('.feature.yaml') || f.endsWith('.feature.yml'))
      .map((f) => parseFeature(join(dir, f)));
  } catch {
    return [];
  }
};
