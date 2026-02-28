import { describe, it, expect } from 'vitest';
import { resolveAll } from '../src/resolvers/view.resolver.js';
import { parseViewFromString } from '../src/parsers/view.parser.js';
import { WidgetRegistry } from '../src/parsers/widget.parser.js';
import { collectNodes } from '../src/ast/visitor.js';
import type { WidgetNode, SectionNode } from '../src/ast/nodes.js';

const registry = new WidgetRegistry();

describe('View Resolver', () => {
  it('resolves $ref by inlining sections', () => {
    const dashboard = parseViewFromString(`
name: AdminDashboard
type: dashboard
route: /admin
sections:
  - name: Usage Stats
    type: stat-cards
    widgets:
      - type: stat-card
        source: stats.users
        label: Users
`);
    const full = parseViewFromString(`
name: FullAdmin
type: dashboard
route: /full
sections:
  - $ref: admin-dashboard#Usage Stats
`);

    const { pages, errors } = resolveAll([dashboard, full], registry);
    expect(errors).toHaveLength(0);
    const widgets = collectNodes<WidgetNode>(pages[1], 'widget');
    expect(widgets).toHaveLength(1);
    expect(widgets[0].props.label).toBe('Users');
  });

  it('reports error for broken $ref', () => {
    const page = parseViewFromString(`
name: Broken
type: page
route: /broken
sections:
  - $ref: nonexistent#Foo
`);
    const { errors } = resolveAll([page], registry);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe('FL003');
  });

  it('reports error for unknown widget type', () => {
    const page = parseViewFromString(`
name: Bad
type: page
route: /bad
sections:
  - type: totally-fake-widget
    source: x
`);
    const { errors } = resolveAll([page], registry);
    expect(errors.some((e) => e.code === 'FL001')).toBe(true);
  });

  it('detects circular $ref', () => {
    const a = parseViewFromString(`
name: PageA
type: page
route: /a
sections:
  - name: SectionA
    type: stat-cards
    widgets:
      - $ref: page-b#SectionB
`);
    const b = parseViewFromString(`
name: PageB
type: page
route: /b
sections:
  - name: SectionB
    type: stat-cards
    widgets:
      - $ref: page-a#SectionA
`);
    const { errors } = resolveAll([a, b], registry);
    expect(errors.some((e) => e.code === 'FL010')).toBe(true);
  });
});
