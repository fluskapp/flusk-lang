/**
 * Shared naming convention utilities
 *
 * Single source of truth for case conversions used across
 * parsers, generators, and the exploder.
 */

export const toCamel = (s: string): string =>
  s.split(/[-_ ]+/)
    .map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');

export const toPascal = (s: string): string =>
  s.split(/[-_ ]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');

export const toKebab = (s: string): string =>
  s.replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[_ ]+/g, '-');

export const capitalize = (s: string): string => {
  if (!s.includes('-') && !s.includes('_') && !s.includes(' ')) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  const c = toCamel(s);
  return c.charAt(0).toUpperCase() + c.slice(1);
};

export const escStr = (s: string): string =>
  s.replace(/'/g, "\\'").replace(/\n/g, '\\n');
