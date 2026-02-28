/**
 * View Compilation Pipeline
 *
 * YAML → Parse → Resolve → Validate → Generate
 *
 * Single entry point for the full view compilation flow.
 */

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseView } from './parsers/view.parser.js';
import { createRegistry } from './parsers/widget.parser.js';
import { resolveAll } from './resolvers/view.resolver.js';
import { validateViews, type ViewDiagnostic } from './validators/view.validator.js';
import { generatePage } from './generators/react/page.gen.js';
import { generateLoader, loaderFileName } from './generators/react/loader.gen.js';
import { generateRoutes, generateComponentBarrel } from './generators/react/routes.gen.js';
import { collectNodes } from './ast/visitor.js';
import type { PageNode, WidgetNode } from './ast/nodes.js';

// ─── Pipeline Output ─────────────────────────────────────────────────

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface PipelineResult {
  files: GeneratedFile[];
  diagnostics: ViewDiagnostic[];
  pages: PageNode[];
}

// ─── Run the full pipeline ───────────────────────────────────────────

export const buildViews = (
  viewsDir: string,
  widgetsDir?: string,
): PipelineResult => {
  // 1. Discover
  const viewFiles = discoverFiles(viewsDir, '.view.yaml');

  if (viewFiles.length === 0) {
    return { files: [], diagnostics: [], pages: [] };
  }

  // 2. Parse
  const pages = viewFiles.map((f) => parseView(f));

  // 3. Widget registry
  const registry = createRegistry(widgetsDir);

  // 4. Resolve
  const { pages: resolved, errors: resolveErrors } = resolveAll(pages, registry);

  // 5. Validate
  const diagnostics: ViewDiagnostic[] = [
    ...resolveErrors.map((e) => ({
      severity: 'error' as const,
      code: e.code,
      message: e.message,
      file: e.file,
      line: e.line,
      col: e.col,
    })),
    ...validateViews(resolved, registry),
  ];

  // 6. Generate
  const files: GeneratedFile[] = [];
  const allWidgetTypes: string[] = [];

  for (const page of resolved) {
    // Page file
    const kebab = toKebab(page.name);
    files.push({
      path: `pages/${kebab}.page.tsx`,
      content: generatePage(page),
    });

    // Loader file
    const loader = generateLoader(page);
    if (loader) {
      files.push({
        path: `loaders/${loaderFileName(page)}`,
        content: loader,
      });
    }

    // Collect widget types for barrel
    const widgets = collectNodes<WidgetNode>(page, 'widget');
    allWidgetTypes.push(...widgets.map((w) => w.widgetType));
  }

  // Route registry
  files.push({
    path: 'routes.ts',
    content: generateRoutes(resolved),
  });

  // Component barrel
  files.push({
    path: 'components/index.ts',
    content: generateComponentBarrel(allWidgetTypes),
  });

  return { files, diagnostics, pages: resolved };
};

// ─── Helpers ─────────────────────────────────────────────────────────

const discoverFiles = (dir: string, suffix: string): string[] => {
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith(suffix))
      .map((f) => join(dir, f));
  } catch {
    return [];
  }
};

const toKebab = (name: string): string =>
  name.replace(/([A-Z])/g, (_, c, i) => (i > 0 ? '-' : '') + c.toLowerCase());
