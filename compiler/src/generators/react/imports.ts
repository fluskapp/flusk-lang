/**
 * Import tracker — deduplicates imports across a generated file
 */

export class ImportTracker {
  private imports = new Map<string, Set<string>>();

  add(from: string, name: string): void {
    let set = this.imports.get(from);
    if (!set) {
      set = new Set();
      this.imports.set(from, set);
    }
    set.add(name);
  }

  emit(): string {
    const lines: string[] = [];
    for (const [from, names] of this.imports) {
      const sorted = [...names].sort();
      lines.push(`import { ${sorted.join(', ')} } from '${from}'`);
    }
    return lines.join('\n');
  }

  has(from: string, name: string): boolean {
    return this.imports.get(from)?.has(name) ?? false;
  }
}
