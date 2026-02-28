/**
 * Feature AST — the top-level node representing a full feature
 * A feature explodes into sub-YAMLs for every layer of the system
 */

export interface FeatureEntity {
  name: string;
  description?: string;
  fields: FeatureField[];
  queries?: FeatureQuery[];
  relations?: FeatureRelation[];
  capabilities?: string[];
}

export interface FeatureField {
  name: string;
  type: string;
  required?: boolean;
  unique?: boolean;
  indexed?: boolean;
  encrypted?: boolean;
  nullable?: boolean;
  default?: unknown;
  values?: string[];
  description?: string;
}

export interface FeatureQuery {
  name: string;
  by?: string;
  where?: string;
  order?: string;
  limit?: number;
}

export interface FeatureRelation {
  entity: string;
  type: 'has-many' | 'belongs-to' | 'has-one';
  foreignKey?: string;
}

export interface FeatureRoute {
  name: string;
  method: string;
  path: string;
  auth?: string;
  input?: FeatureRouteParam[];
  actions?: FeatureAction[];
  loader?: string;
  response?: { status: number; body?: unknown };
}

export interface FeatureRouteParam {
  name: string;
  type: string;
  required?: boolean;
}

export interface FeatureAction {
  type: 'validate' | 'create' | 'update' | 'delete' | 'call' | 'emit';
  target: string;
  params?: Record<string, unknown>;
}

export interface FeatureFunction {
  name: string;
  description?: string;
  input: FeatureRouteParam[];
  output?: { type: string; fields?: string[] };
  uses?: string;
  steps?: string[];
}

export interface FeatureEvent {
  name: string;
  payload: FeatureRouteParam[];
  triggers?: FeatureTrigger[];
}

export interface FeatureTrigger {
  type: 'worker' | 'function' | 'webhook';
  target: string;
}

export interface FeatureWorker {
  name: string;
  concurrency?: number;
  retry?: { max: number; backoff?: string };
  steps: FeatureWorkerStep[];
}

export interface FeatureWorkerStep {
  type: 'load' | 'call' | 'update' | 'emit' | 'condition';
  target: string;
  params?: Record<string, unknown>;
}

export interface FeatureClient {
  name: string;
  base_url: string;
  auth?: { type: string; token?: string; header?: string };
  methods: FeatureClientMethod[];
}

export interface FeatureClientMethod {
  name: string;
  method: string;
  path: string;
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
}

export interface FeatureMiddleware {
  name: string;
  type: string;
  config?: Record<string, unknown>;
}

export interface FeatureCommand {
  name: string;
  subcommands: FeatureSubcommand[];
}

export interface FeatureSubcommand {
  name: string;
  description: string;
  args?: FeatureRouteParam[];
  action?: string;
  data?: string;
  output?: string;
}

export interface FeatureView {
  name: string;
  route: string;
  title: string;
  loader?: string;
  sections: unknown[];
}

export interface FeatureWidget {
  name: string;
  props: FeatureRouteParam[];
  template: unknown;
}

export interface FeatureTest {
  name: string;
  steps: FeatureTestStep[];
}

export interface FeatureTestStep {
  type: 'post' | 'get' | 'put' | 'delete' | 'wait' | 'assert' | 'auth';
  path?: string;
  body?: unknown;
  headers?: Record<string, string>;
  expect?: { status?: number };
  target?: string;
  condition?: string;
}

export interface FeatureNode {
  name: string;
  description?: string;
  version?: string;
  entities: FeatureEntity[];
  routes: FeatureRoute[];
  functions: FeatureFunction[];
  events: FeatureEvent[];
  workers: FeatureWorker[];
  clients: FeatureClient[];
  middleware: FeatureMiddleware[];
  commands: FeatureCommand[];
  views: FeatureView[];
  widgets: FeatureWidget[];
  tests: { integration: FeatureTest[] };
}
