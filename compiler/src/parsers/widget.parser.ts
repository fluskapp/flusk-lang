/**
 * Widget Parser — loads widget definitions from YAML + built-ins
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';

// ─── Widget Definition ───────────────────────────────────────────────

export interface WidgetProp {
  type: string;          // string, number, boolean, enum, binding, icon, object
  required?: boolean;
  default?: unknown;
  values?: string[];     // For enum type
  description?: string;
}

export interface WidgetSlotDef {
  description?: string;
  optional?: boolean;
}

export interface WidgetDef {
  name: string;
  category: string;
  description?: string;
  extends?: string;
  props: Record<string, WidgetProp>;
  slots?: Record<string, WidgetSlotDef>;
  accessibility?: Record<string, unknown>;
  responsive?: Record<string, unknown>;
  template?: string;     // Custom template path
}

// ─── Built-in Widget Registry ────────────────────────────────────────

const BUILT_IN_WIDGETS: WidgetDef[] = [
  // Display
  { name: 'stat-card', category: 'display', props: {
    source: { type: 'binding', required: true },
    label: { type: 'string', required: true },
    format: { type: 'enum', values: ['number', 'currency', 'percent', 'duration', 'bytes'], default: 'number' },
    icon: { type: 'icon' },
  }},
  { name: 'badge', category: 'display', props: {
    source: { type: 'binding', required: true },
    variant: { type: 'enum', values: ['solid', 'outline', 'subtle'], default: 'solid' },
    color: { type: 'string' },
  }},
  { name: 'avatar', category: 'display', props: {
    source: { type: 'binding', required: true },
    alt: { type: 'string', required: true },
    size: { type: 'enum', values: ['sm', 'md', 'lg', 'xl'], default: 'md' },
    fallback: { type: 'enum', values: ['initials', 'icon'], default: 'initials' },
  }},
  { name: 'progress', category: 'display', props: {
    source: { type: 'binding', required: true },
    max: { type: 'number', default: 100 },
    label: { type: 'string' },
    color: { type: 'string' },
  }},
  // Typography
  { name: 'heading', category: 'typography', props: {
    source: { type: 'binding' },
    text: { type: 'string' },
    tag: { type: 'enum', values: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'], default: 'h2' },
  }},
  { name: 'paragraph', category: 'typography', props: {
    source: { type: 'binding' },
    content: { type: 'string' },
    maxLines: { type: 'number' },
    expandable: { type: 'boolean', default: false },
  }},
  { name: 'markdown', category: 'typography', props: {
    source: { type: 'binding', required: true },
  }},
  // Data
  { name: 'data-table', category: 'data', props: {
    source: { type: 'binding', required: true },
    columns: { type: 'string[]', required: true },
    actions: { type: 'string[]' },
    sortable: { type: 'boolean', default: true },
    filterable: { type: 'boolean', default: false },
    paginate: { type: 'boolean', default: true },
  }},
  { name: 'chart', category: 'data', props: {
    source: { type: 'binding', required: true },
    chart: { type: 'object', required: true },
    animate: { type: 'boolean', default: true },
  }},
  { name: 'bar-chart', category: 'data', props: {
    bars: { type: 'object[]', required: true },
    animate: { type: 'boolean', default: true },
  }},
  // Input
  { name: 'form', category: 'input', props: {
    fields: { type: 'object[]', required: true },
    submit: { type: 'string' },
  }},
  { name: 'search-bar', category: 'input', props: {
    placeholder: { type: 'string', default: 'Search...' },
    source: { type: 'binding' },
  }},
  // Interactive
  { name: 'chat-messages', category: 'interactive', props: {
    source: { type: 'binding', required: true },
    features: { type: 'object' },
  }},
  { name: 'chat-input', category: 'interactive', props: {} },
  // Layout
  { name: 'hero', category: 'layout', props: {
    heading: { type: 'object', required: true },
    subheading: { type: 'object' },
  }},
  { name: 'feature-grid', category: 'layout', props: {
    features: { type: 'object[]', required: true },
    heading: { type: 'object' },
  }},
  { name: 'team-grid', category: 'layout', props: {
    members: { type: 'object[]', required: true },
    heading: { type: 'object' },
  }},
  { name: 'tabs', category: 'layout', props: {
    items: { type: 'object[]', required: true },
    default: { type: 'string' },
  }, slots: { content: { description: 'Tab content' } } },
  // Navigation
  { name: 'action-group', category: 'navigation', props: {
    actions: { type: 'object[]', required: true },
  }},
  { name: 'cta', category: 'navigation', props: {
    heading: { type: 'object', required: true },
    actions: { type: 'object[]', required: true },
  }},
  { name: 'breadcrumb', category: 'navigation', props: {
    items: { type: 'string[]', required: true },
  }},
  { name: 'sidebar-nav', category: 'navigation', props: {
    items: { type: 'string[]', required: true },
    active: { type: 'string' },
  }},
  // Media
  { name: 'image', category: 'media', props: {
    source: { type: 'binding', required: true },
    alt: { type: 'string', required: true },
    loading: { type: 'enum', values: ['lazy', 'eager'], default: 'lazy' },
  }},
  // Feedback
  { name: 'empty-state', category: 'feedback', props: {
    icon: { type: 'icon' },
    message: { type: 'string', required: true },
    action: { type: 'object' },
  }},
  { name: 'skeleton', category: 'feedback', props: {
    lines: { type: 'number', default: 3 },
    type: { type: 'enum', values: ['text', 'card', 'table'], default: 'text' },
  }},
  // Composite
  { name: 'stat-cards', category: 'composite', props: {
    layout: { type: 'object' },
  }, slots: { default: { description: 'Stat card children' } } },
  { name: 'card-grid', category: 'composite', props: {
    layout: { type: 'object' },
  }, slots: { default: { description: 'Card children' } } },
  // Special
  { name: 'preview', category: 'display', props: {} },
];

// ─── Widget Registry ─────────────────────────────────────────────────

export class WidgetRegistry {
  private widgets = new Map<string, WidgetDef>();

  constructor() {
    for (const w of BUILT_IN_WIDGETS) {
      this.widgets.set(w.name, w);
    }
  }

  get(name: string): WidgetDef | undefined {
    return this.widgets.get(name);
  }

  has(name: string): boolean {
    return this.widgets.has(name);
  }

  register(widget: WidgetDef): void {
    // Handle extends
    if (widget.extends) {
      const parent = this.widgets.get(widget.extends);
      if (parent) {
        widget = {
          ...parent,
          ...widget,
          props: { ...parent.props, ...widget.props },
          slots: { ...parent.slots, ...widget.slots },
        };
      }
    }
    this.widgets.set(widget.name, widget);
  }

  all(): WidgetDef[] {
    return [...this.widgets.values()];
  }

  names(): string[] {
    return [...this.widgets.keys()];
  }

  /** Load custom widgets from a directory */
  loadDir(dir: string): void {
    try {
      const files = readdirSync(dir)
        .filter((f) => f.endsWith('.widget.yaml') || f.endsWith('.widget.yml'));
      for (const f of files) {
        const content = readFileSync(join(dir, f), 'utf-8');
        const data = yaml.load(content) as WidgetDef;
        this.register(data);
      }
    } catch {
      // Dir doesn't exist — no custom widgets
    }
  }
}

/** Create a registry with built-ins + optional custom dir */
export const createRegistry = (customDir?: string): WidgetRegistry => {
  const registry = new WidgetRegistry();
  if (customDir) registry.loadDir(customDir);
  return registry;
};
