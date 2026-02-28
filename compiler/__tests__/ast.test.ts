import { describe, it, expect } from 'vitest';
import { walkPage, collectNodes } from '../src/ast/visitor.js';
import type { PageNode, WidgetNode, SectionNode, ASTVisitor } from '../src/ast/index.js';

const loc = { file: 'test.yaml', line: 1, col: 1 };
const meta = {};

const makePage = (): PageNode => ({
  kind: 'page', name: 'Test', type: 'dashboard', route: '/test',
  auth: false, ssr: false, loc, meta,
  sections: [
    {
      kind: 'section', name: 'Stats', loc, meta,
      children: [
        { kind: 'widget', widgetType: 'stat-card', props: { label: 'Users' }, loc, meta },
        { kind: 'widget', widgetType: 'chart', props: {}, source: { path: 'data.byDay' }, loc, meta },
      ],
    },
    { kind: 'widget', widgetType: 'data-table', props: { columns: ['a', 'b'] }, loc, meta },
  ],
});

describe('AST Visitor', () => {
  it('walks all widget nodes', () => {
    const types: string[] = [];
    const visitor: ASTVisitor = {
      visitWidget: (n) => { types.push(n.widgetType); return n; },
    };
    walkPage(makePage(), visitor);
    expect(types).toEqual(['stat-card', 'chart', 'data-table']);
  });

  it('transforms widget nodes', () => {
    const visitor: ASTVisitor = {
      visitWidget: (n) => ({ ...n, widgetType: n.widgetType.toUpperCase() }),
    };
    const result = walkPage(makePage(), visitor);
    const widgets = collectNodes<WidgetNode>(result, 'widget');
    expect(widgets.map((w) => w.widgetType)).toEqual(['STAT-CARD', 'CHART', 'DATA-TABLE']);
  });

  it('walks section nodes', () => {
    const names: (string | undefined)[] = [];
    const visitor: ASTVisitor = {
      visitSection: (n) => { names.push(n.name); return n; },
    };
    walkPage(makePage(), visitor);
    expect(names).toEqual(['Stats']);
  });

  it('collects nodes by kind', () => {
    const widgets = collectNodes<WidgetNode>(makePage(), 'widget');
    expect(widgets).toHaveLength(3);
    const sections = collectNodes<SectionNode>(makePage(), 'section');
    expect(sections).toHaveLength(1);
  });

  it('walks conditional nodes', () => {
    const page: PageNode = {
      kind: 'page', name: 'T', type: 'p', route: '/', auth: false, ssr: false, loc, meta,
      sections: [{
        kind: 'conditional', condition: '$data.ok', loc, meta,
        then: [{ kind: 'widget', widgetType: 'badge', props: {}, loc, meta }],
        otherwise: [{ kind: 'widget', widgetType: 'empty-state', props: { message: 'No data' }, loc, meta }],
      }],
    };
    const types: string[] = [];
    walkPage(page, { visitWidget: (n) => { types.push(n.widgetType); return n; } });
    expect(types).toEqual(['badge', 'empty-state']);
  });

  it('walks loop nodes', () => {
    const page: PageNode = {
      kind: 'page', name: 'T', type: 'p', route: '/', auth: false, ssr: false, loc, meta,
      sections: [{
        kind: 'loop', source: '$data.items', as: 'item', loc, meta,
        template: { kind: 'widget', widgetType: 'badge', props: {}, loc, meta },
      }],
    };
    const types: string[] = [];
    walkPage(page, { visitWidget: (n) => { types.push(n.widgetType); return n; } });
    expect(types).toEqual(['badge']);
  });
});
