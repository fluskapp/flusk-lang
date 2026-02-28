import { describe, it, expect } from 'vitest';
import { parseLogicBlock, parseExpression } from '../src/parsers/logic.parser.js';

describe('Logic Parser — Expressions', () => {
  it('parses string literals', () => {
    const expr = parseExpression('"hello"');
    expect(expr).toEqual({ type: 'literal', value: 'hello' });
  });

  it('parses numbers', () => {
    expect(parseExpression('42')).toEqual({ type: 'literal', value: 42 });
    expect(parseExpression('3.14')).toEqual({ type: 'literal', value: 3.14 });
  });

  it('parses booleans and null', () => {
    expect(parseExpression('true')).toEqual({ type: 'literal', value: true });
    expect(parseExpression('null')).toEqual({ type: 'literal', value: null });
  });

  it('parses variables', () => {
    expect(parseExpression('slug')).toEqual({ type: 'variable', name: 'slug' });
  });

  it('parses property access', () => {
    const expr = parseExpression('input.org_name');
    expect(expr).toEqual({
      type: 'property',
      object: { type: 'variable', name: 'input' },
      property: 'org_name',
    });
  });

  it('parses deep property access', () => {
    const expr = parseExpression('org.member.id');
    expect(expr.type).toBe('property');
  });

  it('parses function calls', () => {
    const expr = parseExpression('slugify(input.name)');
    expect(expr.type).toBe('call');
    if (expr.type === 'call') {
      expect(expr.name).toBe('slugify');
      expect(expr.args).toHaveLength(1);
    }
  });

  it('parses unary !', () => {
    const expr = parseExpression('!found');
    expect(expr.type).toBe('unary');
  });

  it('parses binary ??', () => {
    const expr = parseExpression('value ?? "default"');
    expect(expr.type).toBe('binary');
    if (expr.type === 'binary') {
      expect(expr.op).toBe('??');
    }
  });

  it('parses object literals', () => {
    const expr = parseExpression('{ name: input.name, slug }');
    expect(expr.type).toBe('object');
    if (expr.type === 'object') {
      expect(Object.keys(expr.properties)).toContain('name');
      expect(Object.keys(expr.properties)).toContain('slug');
    }
  });

  it('parses db.findOne call', () => {
    const expr = parseExpression("db.findOne(organization, { slug })");
    expect(expr.type).toBe('call');
    if (expr.type === 'call') {
      expect(expr.name).toBe('db.findOne');
    }
  });
});

describe('Logic Parser — Steps', () => {
  it('parses set step (string)', () => {
    const block = parseLogicBlock(['set: slug = slugify(input.org_name)']);
    expect(block.steps).toHaveLength(1);
    expect(block.steps[0]!.kind).toBe('set');
  });

  it('parses set step (object)', () => {
    const block = parseLogicBlock([{ set: 'slug = slugify(input.org_name)' }]);
    expect(block.steps).toHaveLength(1);
    expect(block.steps[0]!.kind).toBe('set');
  });

  it('parses assert step', () => {
    const block = parseLogicBlock(['assert: found, 404, "Not found"']);
    expect(block.steps).toHaveLength(1);
    expect(block.steps[0]!.kind).toBe('assert');
  });

  it('parses assert step (object)', () => {
    const block = parseLogicBlock([{
      assert: 'found',
      status: 404,
      message: 'Not found',
    }]);
    expect(block.steps[0]!.kind).toBe('assert');
  });

  it('parses emit step', () => {
    const block = parseLogicBlock(['emit: org-created, { org_id: org.id }']);
    expect(block.steps[0]!.kind).toBe('emit');
  });

  it('parses return step', () => {
    const block = parseLogicBlock(['return: { token, org }']);
    expect(block.steps[0]!.kind).toBe('return');
  });

  it('parses if/then/else', () => {
    const block = parseLogicBlock([{
      if: '!tool',
      then: ['set: tool = db.insert(ai-tool, { name: provider })'],
      else: ['set: updated = true'],
    }]);
    expect(block.steps[0]!.kind).toBe('if');
  });

  it('parses map step', () => {
    const block = parseLogicBlock([{
      map: 'span in input.spans',
      steps: ['set: provider = span.provider'],
    }]);
    expect(block.steps[0]!.kind).toBe('map');
  });

  it('parses db call step', () => {
    const block = parseLogicBlock(['db.insert: organization, { name: input.name }']);
    expect(block.steps[0]!.kind).toBe('db');
  });

  it('parses full register-org logic', () => {
    const block = parseLogicBlock([
      'set: slug = slugify(input.org_name)',
      { assert: '!db.findOne(organization, { slug })', status: 409, message: 'Org already exists' },
      'set: password_hash = hash(input.password)',
      'set: api_key = apikey.generate()',
      'db.insert: organization, { name: input.org_name, slug, api_key }',
      'emit: org-created, { org_id: org.id }',
      'return: { token, org }',
    ]);
    expect(block.steps).toHaveLength(7);
    expect(block.steps[0]!.kind).toBe('set');
    expect(block.steps[1]!.kind).toBe('assert');
    expect(block.steps[2]!.kind).toBe('set');
    expect(block.steps[3]!.kind).toBe('set');
    expect(block.steps[4]!.kind).toBe('db');
    expect(block.steps[5]!.kind).toBe('emit');
    expect(block.steps[6]!.kind).toBe('return');
  });
});
