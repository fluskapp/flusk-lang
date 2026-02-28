/**
 * flusk-lang View AST — Visitor Pattern
 *
 * Traverses AST trees with per-node-type callbacks.
 * Each compiler phase (resolve, validate, optimize) is a visitor.
 */

import type {
  ASTNode, PageNode, SectionNode, WidgetNode,
  RefNode, PartialNode, SlotNode, ConditionalNode,
  LoopNode, FragmentNode, SectionChild,
} from './nodes.js';

// ─── Visitor Interface ───────────────────────────────────────────────

export interface ASTVisitor {
  visitPage?(node: PageNode): PageNode;
  visitSection?(node: SectionNode): SectionNode;
  visitWidget?(node: WidgetNode): WidgetNode;
  visitRef?(node: RefNode): SectionChild;
  visitPartial?(node: PartialNode): SectionChild;
  visitSlot?(node: SlotNode): SectionChild;
  visitConditional?(node: ConditionalNode): SectionChild;
  visitLoop?(node: LoopNode): SectionChild;
  visitFragment?(node: FragmentNode): SectionChild;
}

// ─── Walk a single child node ────────────────────────────────────────

const walkChild = (node: SectionChild, visitor: ASTVisitor): SectionChild => {
  switch (node.kind) {
    case 'section': return walkSection(node, visitor);
    case 'widget': return visitor.visitWidget?.(node) ?? node;
    case 'ref': return visitor.visitRef?.(node) ?? node;
    case 'partial': return visitor.visitPartial?.(node) ?? node;
    case 'slot': return visitor.visitSlot?.(node) ?? node;
    case 'conditional': return walkConditional(node, visitor);
    case 'loop': return walkLoop(node, visitor);
    case 'fragment': return walkFragment(node, visitor);
    default: return node;
  }
};

// ─── Walk children array ─────────────────────────────────────────────

const walkChildren = (
  children: SectionChild[],
  visitor: ASTVisitor,
): SectionChild[] =>
  children.map((child) => walkChild(child, visitor));

// ─── Walk Section ────────────────────────────────────────────────────

const walkSection = (node: SectionNode, visitor: ASTVisitor): SectionNode => {
  const walked: SectionNode = {
    ...node,
    children: walkChildren(node.children, visitor),
  };
  return visitor.visitSection?.(walked) ?? walked;
};

// ─── Walk Conditional ────────────────────────────────────────────────

const walkConditional = (
  node: ConditionalNode,
  visitor: ASTVisitor,
): SectionChild => {
  const walked: ConditionalNode = {
    ...node,
    then: walkChildren(node.then, visitor),
    otherwise: node.otherwise
      ? walkChildren(node.otherwise, visitor)
      : undefined,
  };
  return visitor.visitConditional?.(walked) ?? walked;
};

// ─── Walk Loop ───────────────────────────────────────────────────────

const walkLoop = (node: LoopNode, visitor: ASTVisitor): SectionChild => {
  const walked: LoopNode = {
    ...node,
    template: walkChild(node.template, visitor),
  };
  return visitor.visitLoop?.(walked) ?? walked;
};

// ─── Walk Fragment ───────────────────────────────────────────────────

const walkFragment = (
  node: FragmentNode,
  visitor: ASTVisitor,
): SectionChild => {
  const walked: FragmentNode = {
    ...node,
    children: walkChildren(node.children, visitor),
  };
  return visitor.visitFragment?.(walked) ?? walked;
};

// ─── Walk Page (Entry Point) ─────────────────────────────────────────

export const walkPage = (page: PageNode, visitor: ASTVisitor): PageNode => {
  const walked: PageNode = {
    ...page,
    sections: walkChildren(page.sections, visitor),
  };
  return visitor.visitPage?.(walked) ?? walked;
};

// ─── Walk any AST node ───────────────────────────────────────────────

export const walkAST = (node: ASTNode, visitor: ASTVisitor): ASTNode => {
  if (node.kind === 'page') return walkPage(node as PageNode, visitor);
  return walkChild(node as SectionChild, visitor);
};

// ─── Collect: gather all nodes of a specific kind ────────────────────

export const collectNodes = <T extends ASTNode>(
  page: PageNode,
  kind: T['kind'],
): T[] => {
  const results: T[] = [];
  const collector: ASTVisitor = {};

  const collect = (node: SectionChild): SectionChild => {
    if (node.kind === kind) results.push(node as T);
    return node;
  };

  // Set up collectors for all node types
  collector.visitWidget = (n) => { collect(n); return n; };
  collector.visitRef = (n) => { collect(n); return n; };
  collector.visitPartial = (n) => { collect(n); return n; };
  collector.visitSlot = (n) => { collect(n); return n; };
  collector.visitSection = (n) => { collect(n); return n; };
  collector.visitConditional = (n) => { collect(n); return n; };
  collector.visitLoop = (n) => { collect(n); return n; };
  collector.visitFragment = (n) => { collect(n); return n; };

  walkPage(page, collector);
  return results;
};
