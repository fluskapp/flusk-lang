import { describe, it, expect } from 'vitest';
import { parseViewFromString } from '../src/parsers/view.parser.js';
import { collectNodes } from '../src/ast/visitor.js';
import type { WidgetNode } from '../src/ast/nodes.js';

describe('Shorthand Syntax', () => {
  it('expands h1: to heading widget', () => {
    const page = parseViewFromString(`
name: Test
type: page
route: /test
sections:
  - h1: About Us
`);
    const widgets = collectNodes<WidgetNode>(page, 'widget');
    expect(widgets).toHaveLength(1);
    expect(widgets[0].widgetType).toBe('heading');
    expect(widgets[0].props.tag).toBe('h1');
    expect(widgets[0].props.text).toBe('About Us');
  });

  it('expands h2-h6 headings', () => {
    const page = parseViewFromString(`
name: Test
type: page
route: /test
sections:
  - h2: Section Title
  - h3: Subsection
`);
    const widgets = collectNodes<WidgetNode>(page, 'widget');
    expect(widgets).toHaveLength(2);
    expect(widgets[0].props.tag).toBe('h2');
    expect(widgets[1].props.tag).toBe('h3');
  });

  it('expands line-chart shorthand', () => {
    const page = parseViewFromString(`
name: Test
type: page
route: /test
sections:
  - line-chart: data.byDay
    x: date
    y: count
`);
    const widgets = collectNodes<WidgetNode>(page, 'widget');
    expect(widgets).toHaveLength(1);
    expect(widgets[0].widgetType).toBe('chart');
    expect(widgets[0].source?.path).toBe('data.byDay');
    expect(widgets[0].props.chart).toEqual({ type: 'line', xAxis: 'date', yAxis: 'count' });
  });

  it('expands area-chart shorthand', () => {
    const page = parseViewFromString(`
name: Test
type: page
route: /test
sections:
  - area-chart: metrics.usage
`);
    const widgets = collectNodes<WidgetNode>(page, 'widget');
    expect(widgets[0].widgetType).toBe('chart');
    expect(widgets[0].props.chart).toEqual({ type: 'area' });
  });

  it('expands donut-chart shorthand', () => {
    const page = parseViewFromString(`
name: Test
type: page
route: /test
sections:
  - donut-chart: cost.byModel
    x: model
    y: cost
`);
    const widgets = collectNodes<WidgetNode>(page, 'widget');
    expect(widgets[0].widgetType).toBe('chart');
    expect(widgets[0].props.chart).toEqual({ type: 'donut', xAxis: 'model', yAxis: 'cost' });
  });

  it('infers data-table from columns + source', () => {
    const page = parseViewFromString(`
name: Test
type: page
route: /test
sections:
  - source: solutions
    columns: [name, status, cost]
`);
    const widgets = collectNodes<WidgetNode>(page, 'widget');
    expect(widgets[0].widgetType).toBe('data-table');
  });
});
