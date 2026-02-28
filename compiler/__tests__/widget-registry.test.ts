import { describe, it, expect } from 'vitest';
import { WidgetRegistry, createRegistry } from '../src/parsers/widget.parser.js';

describe('Widget Registry', () => {
  it('has built-in widgets', () => {
    const reg = new WidgetRegistry();
    expect(reg.has('stat-card')).toBe(true);
    expect(reg.has('data-table')).toBe(true);
    expect(reg.has('chart')).toBe(true);
    expect(reg.has('hero')).toBe(true);
    expect(reg.has('chat-messages')).toBe(true);
  });

  it('returns undefined for unknown widgets', () => {
    const reg = new WidgetRegistry();
    expect(reg.get('foobar')).toBeUndefined();
    expect(reg.has('foobar')).toBe(false);
  });

  it('registers custom widgets', () => {
    const reg = new WidgetRegistry();
    reg.register({
      name: 'usage-heatmap',
      category: 'data',
      props: {
        source: { type: 'binding', required: true },
        groupBy: { type: 'enum', values: ['hour', 'day'] },
      },
    });
    expect(reg.has('usage-heatmap')).toBe(true);
    expect(reg.get('usage-heatmap')?.category).toBe('data');
  });

  it('supports widget extends', () => {
    const reg = new WidgetRegistry();
    reg.register({
      name: 'cost-chart',
      category: 'data',
      extends: 'chart',
      props: {
        currency: { type: 'string', default: 'USD' },
      },
    });
    const def = reg.get('cost-chart');
    expect(def?.props.source).toBeDefined(); // Inherited from chart
    expect(def?.props.currency).toBeDefined(); // Custom prop
  });

  it('lists all widget names', () => {
    const reg = new WidgetRegistry();
    const names = reg.names();
    expect(names.length).toBeGreaterThan(20);
    expect(names).toContain('stat-card');
    expect(names).toContain('data-table');
  });

  it('createRegistry returns a working registry', () => {
    const reg = createRegistry();
    expect(reg.has('stat-card')).toBe(true);
  });
});
