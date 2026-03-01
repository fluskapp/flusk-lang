import { describe, it, expect } from 'vitest';
import { toCamel, toPascal, toKebab, capitalize, escStr } from '../src/utils/naming.js';

describe('naming utilities', () => {
  describe('toCamel', () => {
    it('converts kebab-case', () => expect(toCamel('my-thing')).toBe('myThing'));
    it('converts snake_case', () => expect(toCamel('my_thing')).toBe('myThing'));
    it('converts space separated', () => expect(toCamel('my thing')).toBe('myThing'));
    it('handles single word', () => expect(toCamel('thing')).toBe('thing'));
    it('preserves camelCase input', () => expect(toCamel('registerOrg')).toBe('registerOrg'));
    it('handles multiple segments', () => expect(toCamel('a-b-c')).toBe('aBC'));
  });

  describe('toPascal', () => {
    it('converts kebab-case', () => expect(toPascal('my-thing')).toBe('MyThing'));
    it('converts snake_case', () => expect(toPascal('my_thing')).toBe('MyThing'));
    it('handles single word', () => expect(toPascal('thing')).toBe('Thing'));
  });

  describe('toKebab', () => {
    it('converts camelCase', () => expect(toKebab('myThing')).toBe('my-thing'));
    it('converts PascalCase', () => expect(toKebab('MyThing')).toBe('my-thing'));
    it('converts snake_case', () => expect(toKebab('my_thing')).toBe('my-thing'));
    it('handles already kebab', () => expect(toKebab('my-thing')).toBe('my-thing'));
  });

  describe('capitalize', () => {
    it('capitalizes simple word', () => expect(capitalize('thing')).toBe('Thing'));
    it('capitalizes camelCase', () => expect(capitalize('myThing')).toBe('MyThing'));
    it('capitalizes kebab-case', () => expect(capitalize('my-thing')).toBe('MyThing'));
  });

  describe('escStr', () => {
    it('escapes single quotes', () => expect(escStr("it's")).toBe("it\\'s"));
    it('escapes newlines', () => expect(escStr('a\nb')).toBe('a\\nb'));
  });
});
