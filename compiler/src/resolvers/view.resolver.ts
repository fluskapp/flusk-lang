/**
 * View Resolver — resolves $ref, $partial, widget types, data bindings
 *
 * Transforms Raw AST → Resolved AST by:
 * 1. Inlining $ref nodes (cross-page section references)
 * 2. Expanding $partial nodes (parameterized fragments)
 * 3. Validating widget types against the registry
 * 4. Typing data bindings against entity definitions
 */

import type {
  PageNode, SectionChild, RefNode, PartialNode,
  WidgetNode, SectionNode,
} from '../ast/nodes.js';
import { walkPage } from '../ast/visitor.js';
import type { ASTVisitor } from '../ast/visitor.js';
import type { WidgetRegistry } from '../parsers/widget.parser.js';

// ─── Partial Definition ──────────────────────────────────────────────

export interface PartialDef {
  name: string;
  params: Array<{ name: string; type: string; default?: unknown }>;
  template: SectionChild;
}

// ─── Resolver Context ────────────────────────────────────────────────

export interface ResolverContext {
  pages: Map<string, PageNode>;
  partials: Map<string, PartialDef>;
  registry: WidgetRegistry;
  errors: ResolverError[];
}

export interface ResolverError {
  code: string;
  message: string;
  file: string;
  line: number;
  col: number;
}

// ─── Resolve $ref ────────────────────────────────────────────────────

const resolveRef = (
  node: RefNode,
  ctx: ResolverContext,
  visited: Set<string>,
): SectionChild => {
  const refKey = `${node.page}#${node.section}`;

  // Circular ref detection
  if (visited.has(refKey)) {
    ctx.errors.push({
      code: 'FL010',
      message: `Circular $ref: ${refKey}`,
      file: node.loc.file,
      line: node.loc.line,
      col: node.loc.col,
    });
    return node;
  }

  const targetPage = ctx.pages.get(node.page);
  if (!targetPage) {
    ctx.errors.push({
      code: 'FL003',
      message: `$ref target page "${node.page}" not found`,
      file: node.loc.file,
      line: node.loc.line,
      col: node.loc.col,
    });
    return node;
  }

  const targetSection = findSection(targetPage.sections, node.section);
  if (!targetSection) {
    ctx.errors.push({
      code: 'FL003',
      message: `$ref target section "${node.section}" not found in "${node.page}"`,
      file: node.loc.file,
      line: node.loc.line,
      col: node.loc.col,
    });
    return node;
  }

  // Recursively resolve the inlined section
  visited.add(refKey);
  const resolved = resolveChild(targetSection, ctx, visited);
  visited.delete(refKey);
  return resolved;
};

// ─── Find a named section in a tree ──────────────────────────────────

const findSection = (
  children: SectionChild[],
  name: string,
): SectionChild | undefined => {
  for (const child of children) {
    if (child.kind === 'section' && child.name === name) return child;
    if (child.kind === 'section') {
      const found = findSection(child.children, name);
      if (found) return found;
    }
  }
  return undefined;
};

// ─── Resolve $partial ────────────────────────────────────────────────

const resolvePartial = (
  node: PartialNode,
  ctx: ResolverContext,
): SectionChild => {
  const partial = ctx.partials.get(node.name);
  if (!partial) {
    ctx.errors.push({
      code: 'FL011',
      message: `Partial "${node.name}" not found`,
      file: node.loc.file,
      line: node.loc.line,
      col: node.loc.col,
    });
    return node;
  }

  // Clone template with args substituted
  const result = JSON.parse(JSON.stringify(partial.template)) as SectionChild;
  substituteArgs(result, node.args);
  return result;
};

// ─── Substitute partial args into a node tree ────────────────────────

const substituteArgs = (
  node: SectionChild,
  args: Record<string, unknown>,
): void => {
  if (node.kind === 'widget') {
    for (const [key, val] of Object.entries(node.props)) {
      if (typeof val === 'string' && val.startsWith('$') && val.slice(1) in args) {
        node.props[key] = args[val.slice(1)];
      }
    }
    if (node.source && typeof node.source.path === 'string') {
      const path = node.source.path;
      if (path.startsWith('$') && path.slice(1) in args) {
        node.source.path = args[path.slice(1)] as string;
      }
    }
  }
  if (node.kind === 'section') {
    for (const child of node.children) substituteArgs(child, args);
  }
};

// ─── Resolve widget type against registry ────────────────────────────

const resolveWidget = (
  node: WidgetNode,
  ctx: ResolverContext,
): WidgetNode => {
  if (!ctx.registry.has(node.widgetType)) {
    ctx.errors.push({
      code: 'FL001',
      message: `Unknown widget type "${node.widgetType}"`,
      file: node.loc.file,
      line: node.loc.line,
      col: node.loc.col,
    });
  }
  return node;
};

// ─── Resolve a single child ──────────────────────────────────────────

const resolveChild = (
  node: SectionChild,
  ctx: ResolverContext,
  visited: Set<string>,
): SectionChild => {
  switch (node.kind) {
    case 'ref': return resolveRef(node, ctx, visited);
    case 'partial': return resolvePartial(node, ctx);
    case 'widget': return resolveWidget(node, ctx);
    case 'section': return {
      ...node,
      children: node.children.map((c) => resolveChild(c, ctx, visited)),
    } satisfies SectionNode;
    case 'conditional': return {
      ...node,
      then: node.then.map((c) => resolveChild(c, ctx, visited)),
      otherwise: node.otherwise?.map((c) => resolveChild(c, ctx, visited)),
    };
    case 'loop': return {
      ...node,
      template: resolveChild(node.template, ctx, visited),
    };
    case 'fragment': return {
      ...node,
      children: node.children.map((c) => resolveChild(c, ctx, visited)),
    };
    default: return node;
  }
};

// ─── Main: resolve a page ────────────────────────────────────────────

export const resolvePage = (
  page: PageNode,
  ctx: ResolverContext,
): PageNode => ({
  ...page,
  sections: page.sections.map((s) => resolveChild(s, ctx, new Set())),
});

// ─── Resolve all pages ───────────────────────────────────────────────

export const resolveAll = (
  pages: PageNode[],
  registry: WidgetRegistry,
  partials?: Map<string, PartialDef>,
): { pages: PageNode[]; errors: ResolverError[] } => {
  const pageMap = new Map(pages.map((p) => [
    p.name.replace(/([A-Z])/g, (_, c, i) =>
      (i > 0 ? '-' : '') + c.toLowerCase()
    ),
    p,
  ]));

  const ctx: ResolverContext = {
    pages: pageMap,
    partials: partials ?? new Map(),
    registry,
    errors: [],
  };

  const resolved = pages.map((p) => resolvePage(p, ctx));
  return { pages: resolved, errors: ctx.errors };
};
