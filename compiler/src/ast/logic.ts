/**
 * Logic DSL AST — declarative business logic nodes
 * Parsed from `logic:` blocks in function YAML definitions
 */

/** Base node with optional line info for error reporting */
export interface LogicNode {
  kind: string;
}

/** set: variable = expression */
export interface SetNode extends LogicNode {
  kind: 'set';
  variable: string;
  expression: Expression;
}

/** assert: condition, statusCode, message */
export interface AssertNode extends LogicNode {
  kind: 'assert';
  condition: Expression;
  statusCode: number;
  message: string;
}

/** if/else branching */
export interface IfNode extends LogicNode {
  kind: 'if';
  condition: Expression;
  then: LogicNode[];
  else?: LogicNode[];
}

/** map: item in collection → steps */
export interface MapNode extends LogicNode {
  kind: 'map';
  variable: string;
  collection: Expression;
  steps: LogicNode[];
}

/** emit: eventName, payload */
export interface EmitNode extends LogicNode {
  kind: 'emit';
  event: string;
  payload: Record<string, Expression>;
}

/** return: value */
export interface ReturnNode extends LogicNode {
  kind: 'return';
  value: Expression;
}

/** db.findOne / db.find / db.insert / db.update / db.delete / db.count */
export interface DbCallNode extends LogicNode {
  kind: 'db';
  op: 'find' | 'findOne' | 'insert' | 'update' | 'delete' | 'count';
  entity: string;
  params: Record<string, Expression>;
}

/** http.get / http.post etc — external API call */
export interface HttpCallNode extends LogicNode {
  kind: 'http';
  method: 'get' | 'post' | 'put' | 'delete';
  url: Expression;
  body?: Expression;
  headers?: Record<string, Expression>;
}

/** Call a built-in primitive: hash, verify, jwt.sign, etc. */
export interface PrimitiveCallNode extends LogicNode {
  kind: 'primitive';
  name: string;
  args: Expression[];
}

/** Expression types — the right-hand side of assignments */
export type Expression =
  | LiteralExpr
  | VariableExpr
  | PropertyAccessExpr
  | FunctionCallExpr
  | BinaryExpr
  | UnaryExpr
  | ObjectExpr
  | ArrayExpr
  | TemplateExpr;

export interface LiteralExpr {
  type: 'literal';
  value: string | number | boolean | null;
}

export interface VariableExpr {
  type: 'variable';
  name: string;
}

export interface PropertyAccessExpr {
  type: 'property';
  object: Expression;
  property: string;
}

export interface FunctionCallExpr {
  type: 'call';
  name: string;
  args: Expression[];
}

export interface BinaryExpr {
  type: 'binary';
  op: '==' | '!=' | '>' | '<' | '>=' | '<=' | '&&' | '||' | '??' | '+' | '-' | '*' | '/';
  left: Expression;
  right: Expression;
}

export interface UnaryExpr {
  type: 'unary';
  op: '!' | '-';
  operand: Expression;
}

export interface ObjectExpr {
  type: 'object';
  properties: Record<string, Expression>;
}

export interface ArrayExpr {
  type: 'array';
  elements: Expression[];
}

export interface TemplateExpr {
  type: 'template';
  parts: (string | Expression)[];
}

/** A complete logic block for a function */
export interface LogicBlock {
  steps: LogicNode[];
}

/** All concrete logic node types */
export type AnyLogicNode =
  | SetNode
  | AssertNode
  | IfNode
  | MapNode
  | EmitNode
  | ReturnNode
  | DbCallNode
  | HttpCallNode
  | PrimitiveCallNode;
