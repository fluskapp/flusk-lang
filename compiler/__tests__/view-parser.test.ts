import { describe, it, expect } from 'vitest';
import { parseViewFromString } from '../src/parsers/view.parser.js';
import { collectNodes } from '../src/ast/visitor.js';
import type { WidgetNode, RefNode, LoopNode } from '../src/ast/nodes.js';

describe('View Parser', () => {
  it('parses basic page with widgets', () => {
    const page = parseViewFromString(`
name: Dashboard
type: dashboard
route: /admin
auth: true
ssr: false
sections:
  - type: stat-card
    source: metrics.users
    label: Users
  - type: chart
    source: data.byDay
    chart:
      type: line
`);
    expect(page.kind).toBe('page');
    expect(page.name).toBe('Dashboard');
    expect(page.route).toBe('/admin');
    expect(page.auth).toBe(true);
    const widgets = collectNodes<WidgetNode>(page, 'widget');
    expect(widgets).toHaveLength(2);
    expect(widgets[0].widgetType).toBe('stat-card');
    expect(widgets[0].source?.path).toBe('metrics.users');
    expect(widgets[1].widgetType).toBe('chart');
  });

  it('parses loader config', () => {
    const page = parseViewFromString(`
name: Test
type: page
route: /test
loader:
  source: Analytics
  params: [tenant, period]
sections: []
`);
    expect(page.loader?.source).toBe('Analytics');
    expect(page.loader?.params).toEqual(['tenant', 'period']);
  });

  it('parses $ref nodes', () => {
    const page = parseViewFromString(`
name: Full
type: dashboard
route: /full
sections:
  - $ref: dashboard#Usage Stats
`);
    const refs = collectNodes<RefNode>(page, 'ref');
    expect(refs).toHaveLength(1);
    expect(refs[0].page).toBe('dashboard');
    expect(refs[0].section).toBe('Usage Stats');
  });

  it('parses nested sections with widgets', () => {
    const page = parseViewFromString(`
name: Test
type: dashboard
route: /test
sections:
  - name: Metrics
    type: stat-cards
    layout:
      sm: stack
      md: grid-3
    widgets:
      - type: stat-card
        source: m.a
        label: A
      - type: stat-card
        source: m.b
        label: B
`);
    const widgets = collectNodes<WidgetNode>(page, 'widget');
    expect(widgets).toHaveLength(2);
    expect(widgets[0].props.label).toBe('A');
  });

  it('parses loop (each) nodes', () => {
    const page = parseViewFromString(`
name: Test
type: page
route: /test
sections:
  - each: $data.items
    as: item
    template:
      type: badge
      source: $item.status
`);
    const loops = collectNodes<LoopNode>(page, 'loop');
    expect(loops).toHaveLength(1);
    expect(loops[0].source).toBe('$data.items');
    expect(loops[0].as).toBe('item');
  });

  it('wraps show/hide in conditional nodes', () => {
    const page = parseViewFromString(`
name: Test
type: page
route: /test
sections:
  - type: empty-state
    show: $data.isEmpty
    message: No data
`);
    expect(page.sections[0].kind).toBe('conditional');
  });

  it('parses $partial nodes', () => {
    const page = parseViewFromString(`
name: Test
type: page
route: /test
sections:
  - $partial: metric-row
    metrics: $data.kpis
    columns: 3
`);
    expect(page.sections[0].kind).toBe('partial');
  });
});
