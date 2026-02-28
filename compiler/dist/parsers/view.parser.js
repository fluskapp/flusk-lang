/**
 * View Parser — YAML → PageNode AST
 */
import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
const loc = (file, line = 1, col = 1) => ({ file, line, col });
const meta = () => ({});
// ─── Parse data binding path ─────────────────────────────────────────
const parseBinding = (source) => {
    if (typeof source !== 'string')
        return undefined;
    return { path: source };
};
// ─── Parse layout config ─────────────────────────────────────────────
const parseLayout = (raw) => {
    if (!raw || typeof raw !== 'object')
        return undefined;
    const obj = raw;
    return {
        sm: obj.sm, md: obj.md, lg: obj.lg, xl: obj.xl,
    };
};
// ─── Parse a single section/widget from YAML ─────────────────────────
const parseChild = (raw, file) => {
    // $ref node
    if (raw.$ref && typeof raw.$ref === 'string') {
        const [page, section] = raw.$ref.split('#');
        return {
            kind: 'ref',
            target: raw.$ref,
            page: page ?? '',
            section: section ?? '',
            loc: loc(file),
            meta: meta(),
        };
    }
    // $partial node
    if (raw.$partial && typeof raw.$partial === 'string') {
        const { $partial, ...args } = raw;
        return {
            kind: 'partial',
            name: $partial,
            args,
            loc: loc(file),
            meta: meta(),
        };
    }
    // Loop node (each)
    if (raw.each && typeof raw.each === 'string') {
        return {
            kind: 'loop',
            source: raw.each,
            as: raw.as ?? 'item',
            template: parseChild(raw.template, file),
            loc: loc(file),
            meta: meta(),
        };
    }
    // Section with children (has `widgets` or `sections`)
    const hasWidgets = Array.isArray(raw.widgets);
    const hasSections = Array.isArray(raw.sections);
    const hasChildren = hasWidgets || hasSections;
    if (hasChildren) {
        const rawChildren = (raw.widgets ?? raw.sections);
        const children = rawChildren.map((c) => parseChild(c, file));
        // Wrap in conditional if show/hide
        const section = {
            kind: 'section',
            name: raw.name,
            layout: parseLayout(raw.layout),
            tag: raw.tag,
            ariaLabel: raw['aria-label'],
            children,
            loc: loc(file),
            meta: meta(),
        };
        if (raw.show || raw.hide) {
            return {
                kind: 'conditional',
                condition: (raw.show ?? `!${raw.hide}`),
                then: [section],
                loc: loc(file),
                meta: meta(),
            };
        }
        return section;
    }
    // Widget node (leaf — has `type`)
    const widgetType = raw.type;
    const { type, source, name, show, hide, layout, ...rest } = raw;
    const widget = {
        kind: 'widget',
        widgetType: widgetType ?? 'unknown',
        source: parseBinding(source),
        props: rest,
        show: show,
        hide: hide,
        loc: loc(file),
        meta: meta(),
    };
    // Wrap single widget in conditional if needed
    if (show || hide) {
        return {
            kind: 'conditional',
            condition: (show ?? `!${hide}`),
            then: [widget],
            loc: loc(file),
            meta: meta(),
        };
    }
    return widget;
};
// ─── Parse sections array ────────────────────────────────────────────
const parseSections = (raw, file) => raw.map((s) => parseChild(s, file));
// ─── Main: parse a .view.yaml file into a PageNode ───────────────────
export const parseView = (filePath) => {
    const content = readFileSync(filePath, 'utf-8');
    const data = yaml.load(content);
    return {
        kind: 'page',
        name: data.name,
        type: data.type,
        route: data.route,
        auth: data.auth ?? false,
        ssr: data.ssr ?? false,
        loader: data.loader
            ? {
                source: data.loader.source,
                params: data.loader.params ?? [],
            }
            : undefined,
        pageMeta: data.meta,
        accessibility: data.accessibility,
        responsive: data.responsive,
        sections: parseSections((data.sections ?? []), filePath),
        loc: loc(filePath),
        meta: {},
    };
};
// ─── Parse from string (for testing) ─────────────────────────────────
export const parseViewFromString = (content, file = '<inline>') => {
    const data = yaml.load(content);
    return {
        kind: 'page',
        name: data.name,
        type: data.type,
        route: data.route,
        auth: data.auth ?? false,
        ssr: data.ssr ?? false,
        loader: data.loader
            ? {
                source: data.loader.source,
                params: data.loader.params ?? [],
            }
            : undefined,
        sections: parseSections((data.sections ?? []), file),
        loc: loc(file),
        meta: {},
    };
};
