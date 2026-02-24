import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { lintGeneratedCode } from '../src/validators/lint.validator.js';
import { parseEntity } from '../src/parsers/entity.parser.js';
import { parseFunction } from '../src/parsers/function.parser.js';
import { parseCommand } from '../src/parsers/command.parser.js';
import { parseRoute } from '../src/parsers/route.parser.js';
import { parseProvider } from '../src/parsers/provider.parser.js';
import { parseClient } from '../src/parsers/client.parser.js';
import { parseService } from '../src/parsers/service.parser.js';
import { parseMiddleware } from '../src/parsers/middleware.parser.js';
import { parsePlugin } from '../src/parsers/plugin.parser.js';
import { generateEntitySchema, generateEntityType, generateEntityRepository } from '../src/generators/node/entity.gen.js';
import { generateFunction } from '../src/generators/node/function.gen.js';
import { generateCommand } from '../src/generators/node/command.gen.js';
import { generateRoute } from '../src/generators/node/route.gen.js';
import { generateProvider } from '../src/generators/node/provider.gen.js';
import { generateClient } from '../src/generators/node/client.gen.js';
import { generateService } from '../src/generators/node/service.gen.js';
import { generateMiddleware } from '../src/generators/node/middleware.gen.js';
import { generatePlugin } from '../src/generators/node/plugin.gen.js';

const examples = join(__dirname, '../../examples');

const assertNoAny = (result: ReturnType<typeof lintGeneratedCode>) => {
  const anyIssues = result.issues.filter((i) => i.rule === 'no-explicit-any');
  expect(anyIssues, `${result.file}: ${anyIssues.map((i) => i.message).join(', ')}`).toHaveLength(0);
};

const assertHeader = (result: ReturnType<typeof lintGeneratedCode>) => {
  const headerIssues = result.issues.filter((i) => i.rule === 'generated-header');
  expect(headerIssues, `${result.file}: missing header`).toHaveLength(0);
};

describe('Lint-clean integration — all example YAMLs', () => {
  it('entity: alert-channel has no any and has header', () => {
    const def = parseEntity(join(examples, 'alert-channel.entity.yaml'));
    for (const [name, code] of [
      ['schema', generateEntitySchema(def)],
      ['types', generateEntityType(def)],
      ['repo', generateEntityRepository(def)],
    ] as const) {
      const r = lintGeneratedCode(`alert-channel.${name}.ts`, code);
      assertNoAny(r);
      assertHeader(r);
    }
  });

  it('entity: alert-event has no any and has header', () => {
    const def = parseEntity(join(examples, 'alert-event.entity.yaml'));
    const r = lintGeneratedCode('alert-event.schema.ts', generateEntitySchema(def));
    assertNoAny(r);
    assertHeader(r);
  });

  it('function: dispatch-alert has no any', () => {
    const def = parseFunction(join(examples, 'dispatch-alert.function.yaml'));
    const r = lintGeneratedCode('dispatch-alert.ts', generateFunction(def));
    assertNoAny(r);
    assertHeader(r);
  });

  it('function: process-alert-batch has no any', () => {
    const def = parseFunction(join(examples, 'process-alert-batch.function.yaml'));
    const r = lintGeneratedCode('process-alert-batch.ts', generateFunction(def));
    assertNoAny(r);
    assertHeader(r);
  });

  it('command: alerts-setup has no any', () => {
    const def = parseCommand(join(examples, 'alerts-setup.command.yaml'));
    const r = lintGeneratedCode('alerts-setup.ts', generateCommand(def));
    assertNoAny(r);
    assertHeader(r);
  });

  it('route: alert-channels has no any', () => {
    const def = parseRoute(join(examples, 'alert-channels.route.yaml'));
    const r = lintGeneratedCode('alert-channels.ts', generateRoute(def));
    assertNoAny(r);
    assertHeader(r);
  });

  it('provider: slack has no any', () => {
    const def = parseProvider(join(examples, 'slack.provider.yaml'));
    const r = lintGeneratedCode('slack.ts', generateProvider(def));
    assertNoAny(r);
    assertHeader(r);
  });

  it('client: openai has no any', () => {
    const def = parseClient(join(examples, 'openai.client.yaml'));
    const r = lintGeneratedCode('openai.ts', generateClient(def));
    assertNoAny(r);
    assertHeader(r);
  });

  it('service: llm-proxy has no any', () => {
    const def = parseService(join(examples, 'llm-proxy.service.yaml'));
    const r = lintGeneratedCode('llm-proxy.ts', generateService(def));
    assertNoAny(r);
    assertHeader(r);
  });

  it('middleware: cost-calculator has no any', () => {
    const def = parseMiddleware(join(examples, 'cost-calculator.middleware.yaml'));
    const r = lintGeneratedCode('cost-calculator.ts', generateMiddleware(def));
    assertNoAny(r);
    assertHeader(r);
  });

  it('middleware: request-capture has no any', () => {
    const def = parseMiddleware(join(examples, 'request-capture.middleware.yaml'));
    const r = lintGeneratedCode('request-capture.ts', generateMiddleware(def));
    assertNoAny(r);
    assertHeader(r);
  });

  it('plugin: otel-capture has no any', () => {
    const def = parsePlugin(join(examples, 'otel-capture.plugin.yaml'));
    const r = lintGeneratedCode('otel-capture.ts', generatePlugin(def));
    assertNoAny(r);
    assertHeader(r);
  });
});
