/**
 * View Parser — YAML → PageNode AST
 */

import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import type {
  PageNode, SectionChild, SectionNode, WidgetNode,
  RefNode, PartialNode, ConditionalNode, LoopNode,
  SourceLocation, DataBinding, LayoutConfig,
} from '../ast/nodes.js';

const loc = (file: string, line = 1, col = 1): SourceLocation =>
  ({ file, line, col });

const meta = (): Record<string, unknown> => ({});

// ─── Parse data binding path ─────────────────────────────────────────

const parseBinding = (source: unknown): DataBinding | undefined => {
  if (typeof source !== 'string') return undefined;
  return { path: source };
};

// ─── Parse layout config ─────────────────────────────────────────────

const parseLayout = (raw: unknown): LayoutConfig | undefined => {
  if (!raw || typeof raw !== 'object') return undefined;
  const obj = raw as Record<string, string>;
  return {
    sm: obj.sm, md: obj.md, lg: obj.lg, xl: obj.xl,
  };
};

// ─── Parse a single section/widget from YAML ─────────────────────────

const parseChild = (
  raw: Record<string, unknown>,
  file: string,
): SectionChild => {
  // $ref node
  if (raw.$ref && typeof raw.$ref === 'string') {
    const [page, section] = raw.$ref.split('#');
    return {
      kind: 'ref',
      target: raw.$ref,
      page: page ?? '',
      section: section ?? '',
      loc: loc(file),
      meta: meta(),
    } satisfies RefNode;
  }

  // $partial node
  if (raw.$partial && typeof raw.$partial === 'string') {
    const { $partial, ...args } = raw;
    return {
      kind: 'partial',
      name: $partial as string,
      args,
      loc: loc(file),
      meta: meta(),
    } satisfies PartialNode;
  }

  // Loop node (each)
  if (raw.each && typeof raw.each === 'string') {
    return {
      kind: 'loop',
      source: raw.each,
      as: (raw.as as string) ?? 'item',
      template: parseChild(
        raw.template as Record<string, unknown>,
        file,
      ),
      loc: loc(file),
      meta: meta(),
    } satisfies LoopNode;
  }

  // Section with children (has `widgets` or `sections`)
  const hasWidgets = Array.isArray(raw.widgets);
  const hasSections = Array.isArray(raw.sections);
  const hasChildren = hasWidgets || hasSections;

  if (hasChildren) {
    const rawChildren = (raw.widgets ?? raw.sections) as Record<string, unknown>[];
    const children = rawChildren.map((c) => parseChild(c, file));

    // Wrap in conditional if show/hide
    const section: SectionNode = {
      kind: 'section',
      name: raw.name as string | undefined,
      layout: parseLayout(raw.layout),
      tag: raw.tag as string | undefined,
      ariaLabel: raw['aria-label'] as string | undefined,
      children,
      loc: loc(file),
      meta: meta(),
    };

    if (raw.show || raw.hide) {
      return {
        kind: 'conditional',
        condition: (raw.show ?? `!${raw.hide}`) as string,
        then: [section],
        loc: loc(file),
        meta: meta(),
      } satisfies ConditionalNode;
    }

    return section;
  }

  // Widget node (leaf — has `type`)
  const widgetType = raw.type as string;
  const { type, source, name, show, hide, layout, ...rest } = raw;

  const widget: WidgetNode = {
    kind: 'widget',
    widgetType: widgetType ?? 'unknown',
    source: parseBinding(source),
    props: rest,
    show: show as string | undefined,
    hide: hide as string | undefined,
    loc: loc(file),
    meta: meta(),
  };

  // Wrap single widget in conditional if needed
  if (show || hide) {
    return {
      kind: 'conditional',
      condition: (show ?? `!${hide}`) as string,
      then: [widget],
      loc: loc(file),
      meta: meta(),
    } satisfies ConditionalNode;
  }

  return widget;
};

// ─── Parse sections array ────────────────────────────────────────────

const parseSections = (
  raw: unknown[],
  file: string,
): SectionChild[] =>
  raw.map((s) => parseChild(s as Record<string, unknown>, file));

// ─── Main: parse a .view.yaml file into a PageNode ───────────────────

export const parseView = (filePath: string): PageNode => {
  const content = readFileSync(filePath, 'utf-8');
  const data = yaml.load(content) as Record<string, unknown>;

  return {
    kind: 'page',
    name: data.name as string,
    type: data.type as string,
    route: data.route as string,
    auth: (data.auth as boolean) ?? false,
    ssr: (data.ssr as boolean) ?? false,
    loader: data.loader
      ? {
          source: (data.loader as Record<string, unknown>).source as string,
          params: ((data.loader as Record<string, unknown>).params as string[]) ?? [],
        }
      : undefined,
    pageMeta: data.meta as Record<string, string> | undefined,
    accessibility: data.accessibility as PageNode['accessibility'],
    responsive: data.responsive as PageNode['responsive'],
    sections: parseSections(
      (data.sections ?? []) as unknown[],
      filePath,
    ),
    loc: loc(filePath),
    meta: {},
  };
};

// ─── Parse from string (for testing) ─────────────────────────────────

export const parseViewFromString = (
  content: string,
  file = '<inline>',
): PageNode => {
  const data = yaml.load(content) as Record<string, unknown>;
  return {
    kind: 'page',
    name: data.name as string,
    type: data.type as string,
    route: data.route as string,
    auth: (data.auth as boolean) ?? false,
    ssr: (data.ssr as boolean) ?? false,
    loader: data.loader
      ? {
          source: (data.loader as Record<string, unknown>).source as string,
          params: ((data.loader as Record<string, unknown>).params as string[]) ?? [],
        }
      : undefined,
    sections: parseSections(
      (data.sections ?? []) as unknown[],
      file,
    ),
    loc: loc(file),
    meta: {},
  };
};
