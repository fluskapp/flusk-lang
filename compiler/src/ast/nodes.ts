/**
 * flusk-lang View AST — Node Types
 *
 * Canonical intermediate representation for view compilation.
 * All compiler phases operate on these nodes — never on raw YAML.
 */

// ─── Source Location (for LSP + error reporting) ──────────────────────

export interface SourceLocation {
  file: string;
  line: number;
  col: number;
  endLine?: number;
  endCol?: number;
}

// ─── Base Node ────────────────────────────────────────────────────────

export interface BaseNode {
  kind: string;
  loc: SourceLocation;
  meta: Record<string, unknown>;
}

// ─── Data Binding ─────────────────────────────────────────────────────

export interface DataBinding {
  path: string;          // e.g. "metrics.totalUsers"
  entityType?: string;   // Resolved entity name
  fieldType?: string;    // Resolved field type
}

// ─── Layout Config ────────────────────────────────────────────────────

export interface LayoutConfig {
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
}

// ─── Loader Config ────────────────────────────────────────────────────

export interface LoaderConfig {
  source: string;        // Entity name
  params: string[];      // Route params
}

// ─── Accessibility Config ─────────────────────────────────────────────

export interface AccessibilityConfig {
  role?: string;
  ariaLabel?: string;
  ariaLive?: 'polite' | 'assertive' | 'off';
  landmark?: string;
  skipNav?: boolean;
  focusTrap?: boolean;
  reduceMotion?: boolean;
}

// ─── Responsive Config ───────────────────────────────────────────────

export interface ResponsiveConfig {
  strategy?: 'mobile-first' | 'desktop-first';
  breakpoints?: Record<string, string>;
}

// ─── Page Node (Root) ────────────────────────────────────────────────

export interface PageNode extends BaseNode {
  kind: 'page';
  name: string;
  type: string;          // dashboard, page, table, chat, builder
  route: string;
  auth: boolean;
  ssr: boolean;
  loader?: LoaderConfig;
  pageMeta?: Record<string, string>;
  accessibility?: AccessibilityConfig;
  responsive?: ResponsiveConfig;
  sections: SectionChild[];
}

// ─── Section Node (Container) ────────────────────────────────────────

export interface SectionNode extends BaseNode {
  kind: 'section';
  name?: string;
  layout?: LayoutConfig;
  tag?: string;          // HTML semantic tag
  ariaLabel?: string;
  children: SectionChild[];
}

// ─── Widget Node (Leaf) ──────────────────────────────────────────────

export interface WidgetNode extends BaseNode {
  kind: 'widget';
  widgetType: string;    // e.g. "stat-card", "chart", "data-table"
  source?: DataBinding;
  props: Record<string, unknown>;
  slots?: Record<string, SectionChild[]>;
  show?: string;         // Conditional: data path expression
  hide?: string;         // Conditional: inverse
}

// ─── Ref Node (Unresolved — pre-resolution) ──────────────────────────

export interface RefNode extends BaseNode {
  kind: 'ref';
  target: string;        // e.g. "admin-dashboard#Usage Stats"
  page: string;          // Parsed: "admin-dashboard"
  section: string;       // Parsed: "Usage Stats"
}

// ─── Partial Node (Unresolved — pre-resolution) ──────────────────────

export interface PartialNode extends BaseNode {
  kind: 'partial';
  name: string;          // Partial name
  args: Record<string, unknown>;
}

// ─── Slot Node ───────────────────────────────────────────────────────

export interface SlotNode extends BaseNode {
  kind: 'slot';
  name: string;
  description?: string;
  optional: boolean;
}

// ─── Conditional Node ────────────────────────────────────────────────

export interface ConditionalNode extends BaseNode {
  kind: 'conditional';
  condition: string;     // Expression: "$data.hasMetrics"
  then: SectionChild[];
  otherwise?: SectionChild[];
}

// ─── Loop Node ───────────────────────────────────────────────────────

export interface LoopNode extends BaseNode {
  kind: 'loop';
  source: string;        // Data path: "$data.solutions"
  as: string;            // Iterator variable name
  template: SectionChild;
}

// ─── Fragment Node (Grouping) ────────────────────────────────────────

export interface FragmentNode extends BaseNode {
  kind: 'fragment';
  children: SectionChild[];
}

// ─── Union Types ─────────────────────────────────────────────────────

export type SectionChild =
  | SectionNode
  | WidgetNode
  | RefNode
  | PartialNode
  | SlotNode
  | ConditionalNode
  | LoopNode
  | FragmentNode;

export type ASTNode =
  | PageNode
  | SectionChild;
