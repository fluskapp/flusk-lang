/**
 * Partial Parser — loads .partial.yaml reusable fragments
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import type { SectionChild } from '../ast/nodes.js';
import type { PartialDef } from '../resolvers/view.resolver.js';

interface RawPartial {
  name: string;
  params?: Array<{ name: string; type: string; default?: unknown }>;
  template: Record<string, unknown>;
}

// Minimal child parse (reuses view parser logic inline)
const parsePartialTemplate = (
  raw: Record<string, unknown>,
  file: string,
): SectionChild => {
  const loc = { file, line: 1, col: 1 };
  const meta = {};

  if (raw.type) {
    return {
      kind: 'widget',
      widgetType: raw.type as string,
      source: raw.source ? { path: raw.source as string } : undefined,
      props: Object.fromEntries(
        Object.entries(raw).filter(([k]) => !['type', 'source'].includes(k)),
      ),
      loc,
      meta,
    };
  }

  // Section with widgets
  if (Array.isArray(raw.widgets)) {
    return {
      kind: 'section',
      name: raw.name as string | undefined,
      children: (raw.widgets as Record<string, unknown>[]).map((w) =>
        parsePartialTemplate(w, file),
      ),
      loc,
      meta,
    };
  }

  return { kind: 'widget', widgetType: 'unknown', props: raw, loc, meta };
};

export const parsePartial = (filePath: string): PartialDef => {
  const content = readFileSync(filePath, 'utf-8');
  const data = yaml.load(content) as RawPartial;

  return {
    name: data.name,
    params: data.params ?? [],
    template: parsePartialTemplate(data.template, filePath),
  };
};

export const loadPartials = (dir: string): Map<string, PartialDef> => {
  const map = new Map<string, PartialDef>();
  try {
    const files = readdirSync(dir)
      .filter((f) => f.endsWith('.partial.yaml') || f.endsWith('.partial.yml'));
    for (const f of files) {
      const partial = parsePartial(join(dir, f));
      map.set(partial.name, partial);
      // Also register kebab-case alias
      const kebab = partial.name
        .replace(/([A-Z])/g, (_, c, i) => (i > 0 ? '-' : '') + c.toLowerCase());
      if (kebab !== partial.name) map.set(kebab, partial);
    }
  } catch {
    // Dir doesn't exist
  }
  return map;
};
