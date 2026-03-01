# flusk-lang Audit Report

**Date:** 2026-03-01
**Auditor:** Flusk (AI subagent)
**Scope:** compiler/src/ — all source files (~8,400 LOC across 80 files)

---

## What's Good (Honest Assessment)

1. **Clean architecture** — Parser → AST → Validator → Generator pipeline is well-structured. Each concern is separated into its own directory.
2. **282 tests passing, types clean** — solid test foundation covering parsers, generators, validators, exploder, diff, e2e.
3. **Comprehensive feature coverage** — 13 YAML types (entity, function, command, route, provider, client, service, middleware, plugin, event, worker, stream, hook) all have parsers, schemas, and generators.
4. **View pipeline is sophisticated** — Full AST with visitor pattern, partials, conditionals, loops, fragments, responsive layouts, accessibility, SSR. This is genuinely impressive for a young project.
5. **Feature exploder + diff** — The ability to explode a feature YAML into sub-YAMLs and diff against existing files is a killer feature.
6. **Multi-target generation** — Node.js, Python, Watt/Platformatic, React views — broad coverage.
7. **Schema validation with AJV** — proper validation at parse time.
8. **Logic DSL** — a full expression parser + code generator for business logic. Non-trivial and well-tested.

## What's Bad (Brutally Honest)

### 1. `any` Types (6 occurrences)
- `schema.validator.ts:4` — `const Ajv = _Ajv as any;` (AJV default export workaround)
- `plugin.gen.ts:123,173,214,220,226` — `(request as any).orgId`, `input as any` in **generated code** (less critical since it's output, not compiler code)

**Severity: Medium** — The schema.validator one is the real problem. The plugin.gen ones are in generated output strings, which is less clean but acceptable.

### 2. Massive Files (14 files > 100 lines)
| File | Lines | Severity |
|------|-------|----------|
| `watt/logic.gen.ts` | 458 | 🔴 Critical |
| `parsers/logic.parser.ts` | 358 | 🔴 Critical |
| `cli.ts` | 349 | 🔴 Critical |
| `exploder/exploder.ts` | 329 | 🟡 High |
| `watt/plugin.gen.ts` | 279 | 🟡 High |
| `node/function.gen.ts` | 248 | 🟡 High |
| `parsers/view.parser.ts` | 245 | 🟡 Medium |
| `resolvers/view.resolver.ts` | 243 | 🟡 Medium |
| `watt/config.gen.ts` | 241 | 🟡 Medium |
| `exploder/diff.ts` | 237 | 🟡 Medium |
| `parsers/widget.parser.ts` | 234 | 🟡 Medium |
| `validators/view.validator.ts` | 224 | 🟡 Medium |
| `watt/event.gen.ts` | 195 | 🟡 Medium |
| `watt/index.ts` | 190 | 🟡 Medium |

### 3. CLI is a monolith
`cli.ts` (349 lines) — all commands in one file, no proper arg parsing library, imports scattered throughout the file (some at top, some mid-file with `import { buildViews }` at line 145). This is the worst file structurally.

### 4. Duplicated Utility Functions
`toCamel`, `toKebab`, `toPascal`, `capitalize` are reimplemented in at least 5 different files:
- `exploder/exploder.ts`
- `generators/watt/logic.gen.ts`
- `generators/watt/plugin.gen.ts`
- `generators/node/function.gen.ts`
- `pipeline.ts`

### 5. Weak Error Handling
- `loadDir` in `index.ts` silently catches all errors (including permission errors, corrupt YAML, etc.) and returns `[]`
- `discoverFiles` in `pipeline.ts` same pattern
- No structured error types beyond `SchemaValidationError` and `RefValidationError`

### 6. Generated Code Quality
- The `as any` casts in generated plugin code are sloppy — should generate proper type assertions or interfaces
- `plugin.gen.ts:generateFunction` has an unused destructured variable `[client, method]` (line 253)

### 7. `ast/feature.ts` (178 lines) — All Interfaces, No Logic
This is a types-only file with 30+ interfaces. While it's technically >100 lines, splitting types-only files is debatable. However, some interfaces (`FeatureRouteParam`) are reused across unrelated types — should use more specific names.

### 8. No Logging
Zero structured logging anywhere. All output is `console.log`/`console.error`. For a compiler, this is somewhat acceptable but not ideal.

## What's Missing (Prioritized)

### P0 — Must Fix
1. **Extract shared utilities** — `toCamel`, `toKebab`, `toPascal` into `utils/naming.ts`
2. **Fix the AJV `any` cast** — use proper typing for AJV default export
3. **Split `cli.ts`** — extract each command into its own file

### P1 — Should Fix
4. **Split `logic.gen.ts`** (458 lines) — extract expression emitter, db emitter, primitive emitter
5. **Split `logic.parser.ts`** (358 lines) — extract expression parser
6. **Fix silent error swallowing** in `loadDir` / `discoverFiles`
7. **Fix unused variable** in `plugin.gen.ts:generateFunction`

### P2 — Nice to Have
8. **Split `exploder.ts`** (329 lines) — one file per exploder type
9. **Split `plugin.gen.ts`** (279 lines) — auth plugin, route handler, stub function separate
10. **Add structured logging** — at least for the CLI

## Risk Assessment

| Change | Risk | Impact | Notes |
|--------|------|--------|-------|
| Extract naming utils | 🟢 Low | High | Pure refactor, no behavior change |
| Fix AJV any | 🟢 Low | Medium | Well-documented workaround |
| Split cli.ts | 🟡 Medium | High | Entry point — must test thoroughly |
| Split logic.gen.ts | 🟡 Medium | High | Core codegen — many tests cover it |
| Split logic.parser.ts | 🟡 Medium | High | Core parser — many tests cover it |
| Fix error handling | 🟡 Medium | Medium | Changes error behavior — could break workflows |
| Fix unused var | 🟢 Low | Low | Trivial |

---

## Implementation Plan

Starting with P0 items (low risk, high impact), then P1 if tests stay green.
