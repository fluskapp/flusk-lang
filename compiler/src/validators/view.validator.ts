/**
 * View Validator — checks resolved AST for errors
 *
 * Error codes:
 * FL001 — Unknown widget type
 * FL002 — Missing required widget prop
 * FL003 — Broken $ref
 * FL004 — Data type mismatch
 * FL005 — Accessibility violation
 * FL006 — Missing loader for data binding
 * FL010 — Circular $ref
 * FL020 — Unknown entity in loader
 * FL030 — Unknown slot
 */

import type { PageNode, SectionChild, WidgetNode } from '../ast/nodes.js';
import type { WidgetRegistry, WidgetDef } from '../parsers/widget.parser.js';

// ─── Diagnostic ──────────────────────────────────────────────────────

export interface ViewDiagnostic {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  file: string;
  line: number;
  col: number;
}

// ─── Validate widget props against registry ──────────────────────────

const validateWidgetProps = (
  node: WidgetNode,
  def: WidgetDef,
  diagnostics: ViewDiagnostic[],
): void => {
  for (const [propName, propDef] of Object.entries(def.props)) {
    if (!propDef.required) continue;
    const hasInProps = propName in node.props;
    const hasAsSource = propName === 'source' && node.source;
    if (!hasInProps && !hasAsSource) {
      diagnostics.push({
        severity: 'error',
        code: 'FL002',
        message: `Widget "${node.widgetType}" missing required prop "${propName}"`,
        file: node.loc.file,
        line: node.loc.line,
        col: node.loc.col,
      });
    }
  }
};

// ─── Validate accessibility ──────────────────────────────────────────

const validateAccessibility = (
  node: WidgetNode,
  diagnostics: ViewDiagnostic[],
): void => {
  // Image widgets need alt text
  if (node.widgetType === 'image') {
    const hasAlt = 'alt' in node.props || node.props['aria-label'];
    if (!hasAlt) {
      diagnostics.push({
        severity: 'warning',
        code: 'FL005',
        message: 'Image widget missing "alt" text',
        file: node.loc.file,
        line: node.loc.line,
        col: node.loc.col,
      });
    }
  }

  // Interactive widgets need aria-label
  if (['chat-input', 'search-bar', 'form'].includes(node.widgetType)) {
    if (!node.props['aria-label'] && !node.props['label']) {
      diagnostics.push({
        severity: 'info',
        code: 'FL005',
        message: `Widget "${node.widgetType}" should have an aria-label or label`,
        file: node.loc.file,
        line: node.loc.line,
        col: node.loc.col,
      });
    }
  }
};

// ─── Walk and validate all children ──────────────────────────────────

const validateChild = (
  node: SectionChild,
  registry: WidgetRegistry,
  diagnostics: ViewDiagnostic[],
  hasLoader: boolean,
): void => {
  switch (node.kind) {
    case 'widget': {
      const def = registry.get(node.widgetType);
      if (!def) {
        diagnostics.push({
          severity: 'error',
          code: 'FL001',
          message: `Unknown widget type "${node.widgetType}"`,
          file: node.loc.file,
          line: node.loc.line,
          col: node.loc.col,
        });
      } else {
        validateWidgetProps(node, def, diagnostics);
      }
      validateAccessibility(node, diagnostics);

      // Warn if widget has source binding but page has no loader
      if (node.source && !hasLoader) {
        diagnostics.push({
          severity: 'warning',
          code: 'FL006',
          message: `Widget "${node.widgetType}" has data binding "${node.source.path}" but page has no loader`,
          file: node.loc.file,
          line: node.loc.line,
          col: node.loc.col,
        });
      }
      break;
    }
    case 'section':
      for (const child of node.children) {
        validateChild(child, registry, diagnostics, hasLoader);
      }
      break;
    case 'conditional':
      for (const child of node.then) {
        validateChild(child, registry, diagnostics, hasLoader);
      }
      if (node.otherwise) {
        for (const child of node.otherwise) {
          validateChild(child, registry, diagnostics, hasLoader);
        }
      }
      break;
    case 'loop':
      validateChild(node.template, registry, diagnostics, hasLoader);
      break;
    case 'fragment':
      for (const child of node.children) {
        validateChild(child, registry, diagnostics, hasLoader);
      }
      break;
    case 'ref':
      diagnostics.push({
        severity: 'error',
        code: 'FL003',
        message: `Unresolved $ref: "${node.target}" — run resolver first`,
        file: node.loc.file,
        line: node.loc.line,
        col: node.loc.col,
      });
      break;
    case 'partial':
      diagnostics.push({
        severity: 'error',
        code: 'FL011',
        message: `Unresolved $partial: "${node.name}" — run resolver first`,
        file: node.loc.file,
        line: node.loc.line,
        col: node.loc.col,
      });
      break;
  }
};

// ─── Validate page-level concerns ────────────────────────────────────

const validatePage = (
  page: PageNode,
  diagnostics: ViewDiagnostic[],
): void => {
  if (!page.name) {
    diagnostics.push({
      severity: 'error', code: 'FL040',
      message: 'Page missing "name"',
      file: page.loc.file, line: page.loc.line, col: page.loc.col,
    });
  }
  if (!page.route) {
    diagnostics.push({
      severity: 'error', code: 'FL041',
      message: 'Page missing "route"',
      file: page.loc.file, line: page.loc.line, col: page.loc.col,
    });
  }
  if (page.sections.length === 0) {
    diagnostics.push({
      severity: 'warning', code: 'FL042',
      message: `Page "${page.name}" has no sections`,
      file: page.loc.file, line: page.loc.line, col: page.loc.col,
    });
  }
};

// ─── Main: validate a resolved page ──────────────────────────────────

export const validateView = (
  page: PageNode,
  registry: WidgetRegistry,
): ViewDiagnostic[] => {
  const diagnostics: ViewDiagnostic[] = [];
  validatePage(page, diagnostics);
  const hasLoader = !!page.loader;
  for (const section of page.sections) {
    validateChild(section, registry, diagnostics, hasLoader);
  }
  return diagnostics;
};

// ─── Validate multiple pages ─────────────────────────────────────────

export const validateViews = (
  pages: PageNode[],
  registry: WidgetRegistry,
): ViewDiagnostic[] =>
  pages.flatMap((p) => validateView(p, registry));
