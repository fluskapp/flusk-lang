import { describe, it, expect } from 'vitest';
import { validateView } from '../src/validators/view.validator.js';
import { parseViewFromString } from '../src/parsers/view.parser.js';
import { WidgetRegistry } from '../src/parsers/widget.parser.js';

const registry = new WidgetRegistry();

describe('View Validator', () => {
  it('passes for valid page', () => {
    const page = parseViewFromString(`
name: Dashboard
type: dashboard
route: /admin
loader:
  source: Dashboard
  params: [tenant]
sections:
  - type: stat-card
    source: stats.users
    label: Users
`);
    const diags = validateView(page, registry);
    const errors = diags.filter((d) => d.severity === 'error');
    expect(errors).toHaveLength(0);
  });

  it('reports unknown widget type', () => {
    const page = parseViewFromString(`
name: Bad
type: page
route: /bad
sections:
  - type: nonexistent-widget
`);
    const diags = validateView(page, registry);
    expect(diags.some((d) => d.code === 'FL001')).toBe(true);
  });

  it('reports missing required props', () => {
    const page = parseViewFromString(`
name: Bad
type: page
route: /bad
loader:
  source: X
  params: []
sections:
  - type: stat-card
    source: x
`);
    const diags = validateView(page, registry);
    expect(diags.some((d) => d.code === 'FL002' && d.message.includes('label'))).toBe(true);
  });

  it('warns about data binding without loader', () => {
    const page = parseViewFromString(`
name: Bad
type: page
route: /bad
sections:
  - type: stat-card
    source: x
    label: X
`);
    const diags = validateView(page, registry);
    expect(diags.some((d) => d.code === 'FL006')).toBe(true);
  });

  it('warns about image without alt', () => {
    const page = parseViewFromString(`
name: Bad
type: page
route: /bad
sections:
  - type: image
    source: img.url
`);
    const diags = validateView(page, registry);
    expect(diags.some((d) => d.code === 'FL005')).toBe(true);
  });

  it('reports missing page name', () => {
    const page = parseViewFromString(`
type: page
route: /bad
sections: []
`);
    const diags = validateView(page, registry);
    expect(diags.some((d) => d.code === 'FL040')).toBe(true);
  });

  it('warns about empty sections', () => {
    const page = parseViewFromString(`
name: Empty
type: page
route: /empty
sections: []
`);
    const diags = validateView(page, registry);
    expect(diags.some((d) => d.code === 'FL042')).toBe(true);
  });
});
