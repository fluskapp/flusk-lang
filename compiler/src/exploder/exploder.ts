/**
 * Exploder — FeatureNode → sub-YAML file map
 *
 * Maps feature sections to individual YAML files that match
 * existing parsers: entity, function, command, route, event,
 * worker, client, middleware, view, widget
 */

import type { FeatureNode } from '../ast/feature.js';
import type { ExplodedFiles } from './types.js';
import { toCamel } from '../utils/naming.js';
import { explodeEntity } from './entity.exploder.js';
import { explodeRoutes } from './route.exploder.js';
import {
  explodeFunction, explodeEvent, explodeWorker,
  explodeClient, explodeMiddleware, explodeCommand,
  explodeView, explodeWidget,
} from './simple.exploder.js';

export type { ExplodedFile, ExplodedFiles } from './types.js';

export const explodeFeature = (feature: FeatureNode): ExplodedFiles => {
  const files = [
    ...feature.entities.map((e) => explodeEntity(e, feature.name)),
    ...feature.functions.map(explodeFunction),
    ...feature.events.map(explodeEvent),
    ...feature.workers.map(explodeWorker),
    ...feature.clients.map(explodeClient),
    ...feature.middleware.map(explodeMiddleware),
    ...feature.commands.map(explodeCommand),
    ...feature.views.map(explodeView),
    ...feature.widgets.map(explodeWidget),
  ];

  const fnNames = new Set(feature.functions.map((f) => toCamel(f.name)));

  if (feature.routes.length > 0) {
    const { routeFile, handlerFiles } = explodeRoutes(feature.routes, feature.name, fnNames);
    files.push(routeFile, ...handlerFiles);
  }

  return { files, feature: feature.name };
};
