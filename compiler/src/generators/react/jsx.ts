/**
 * JSX emitter — converts AST nodes to JSX strings
 */

import type {
  SectionChild, WidgetNode, SectionNode,
  ConditionalNode, LoopNode, FragmentNode,
} from '../../ast/nodes.js';
import { ImportTracker } from './imports.js';

// ─── Widget type → React component name ──────────────────────────────

const componentName = (widgetType: string): string =>
  widgetType
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');

// ─── Widget type → import source ─────────────────────────────────────

const componentImport = (widgetType: string): string =>
  `../components/${componentName(widgetType)}`;

// ─── Emit a prop value as JSX expression ─────────────────────────────

const emitPropValue = (value: unknown): string => {
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number' || typeof value === 'boolean') return `{${value}}`;
  if (Array.isArray(value)) {
    const items = value.map((v) =>
      typeof v === 'string' ? `'${v}'` : JSON.stringify(v)
    ).join(', ');
    return `{[${items}]}`;
  }
  if (typeof value === 'object' && value !== null) {
    return `{${JSON.stringify(value)}}`;
  }
  return `{${String(value)}}`;
};

// ─── Layout config → className ───────────────────────────────────────

const layoutClasses = (layout?: Record<string, string>): string => {
  if (!layout) return 'space-y-4';
  const classes: string[] = [];
  if (layout.sm === 'stack') classes.push('flex flex-col gap-4');
  else if (layout.sm?.startsWith('grid-')) classes.push(`grid grid-cols-1 gap-4`);
  if (layout.md?.startsWith('grid-')) {
    const cols = layout.md.replace('grid-', '');
    classes.push(`md:grid-cols-${cols}`);
  }
  if (layout.lg?.startsWith('grid-')) {
    const cols = layout.lg.replace('grid-', '');
    classes.push(`lg:grid-cols-${cols}`);
  }
  if (layout.md === 'inline') classes.push('md:flex md:flex-row md:gap-4');
  if (layout.md === 'horizontal') classes.push('md:flex md:flex-row');
  return classes.length > 0 ? classes.join(' ') : 'space-y-4';
};

// ─── Emit a single widget ────────────────────────────────────────────

const emitWidget = (
  node: WidgetNode,
  imports: ImportTracker,
  dataVar: string,
  indent: string,
): string => {
  const name = componentName(node.widgetType);
  imports.add(componentImport(node.widgetType), name);

  const props: string[] = [];

  // Data binding → value prop
  if (node.source) {
    props.push(`data={${dataVar}.${node.source.path}}`);
  }

  // All other props
  for (const [key, val] of Object.entries(node.props)) {
    if (key === 'name') continue; // Section name, not a prop
    props.push(`${key}=${emitPropValue(val)}`);
  }

  if (props.length === 0) return `${indent}<${name} />`;
  if (props.length <= 2) return `${indent}<${name} ${props.join(' ')} />`;

  const propLines = props.map((p) => `${indent}  ${p}`).join('\n');
  return `${indent}<${name}\n${propLines}\n${indent}/>`;
};

// ─── Emit a section ──────────────────────────────────────────────────

const emitSection = (
  node: SectionNode,
  imports: ImportTracker,
  dataVar: string,
  indent: string,
): string => {
  const tag = node.tag ?? 'section';
  const cls = layoutClasses(node.layout as Record<string, string> | undefined);
  const ariaAttr = node.ariaLabel ? ` aria-label="${node.ariaLabel}"` : '';
  const children = node.children
    .map((c) => emitChild(c, imports, dataVar, indent + '  '))
    .join('\n');

  return `${indent}<${tag} className="${cls}"${ariaAttr}>\n${children}\n${indent}</${tag}>`;
};

// ─── Emit conditional ────────────────────────────────────────────────

const emitConditional = (
  node: ConditionalNode,
  imports: ImportTracker,
  dataVar: string,
  indent: string,
): string => {
  const cond = node.condition.replace(/^\$/, `${dataVar}.`);
  const thenBlock = node.then
    .map((c) => emitChild(c, imports, dataVar, indent + '  '))
    .join('\n');

  if (node.otherwise?.length) {
    const elseBlock = node.otherwise
      .map((c) => emitChild(c, imports, dataVar, indent + '  '))
      .join('\n');
    return `${indent}{${cond} ? (\n${thenBlock}\n${indent}) : (\n${elseBlock}\n${indent})}`;
  }

  return `${indent}{${cond} && (\n${thenBlock}\n${indent})}`;
};

// ─── Emit loop ───────────────────────────────────────────────────────

const emitLoop = (
  node: LoopNode,
  imports: ImportTracker,
  dataVar: string,
  indent: string,
): string => {
  const src = node.source.replace(/^\$/, `${dataVar}.`);
  const itemVar = node.as;
  const body = emitChild(node.template, imports, itemVar, indent + '    ');

  return `${indent}{${src}.map((${itemVar}) => (\n${body}\n${indent}))}`;
};

// ─── Emit fragment ───────────────────────────────────────────────────

const emitFragment = (
  node: FragmentNode,
  imports: ImportTracker,
  dataVar: string,
  indent: string,
): string => {
  const children = node.children
    .map((c) => emitChild(c, imports, dataVar, indent + '  '))
    .join('\n');
  return `${indent}<>\n${children}\n${indent}</>`;
};

// ─── Emit any child node ─────────────────────────────────────────────

export const emitChild = (
  node: SectionChild,
  imports: ImportTracker,
  dataVar: string,
  indent: string,
): string => {
  switch (node.kind) {
    case 'widget': return emitWidget(node, imports, dataVar, indent);
    case 'section': return emitSection(node, imports, dataVar, indent);
    case 'conditional': return emitConditional(node, imports, dataVar, indent);
    case 'loop': return emitLoop(node, imports, dataVar, indent);
    case 'fragment': return emitFragment(node, imports, dataVar, indent);
    default: return `${indent}{/* TODO: ${node.kind} */}`;
  }
};

export { componentName, layoutClasses };
