import { describe, it, expect } from 'vitest';
import { parseFeatureFromString } from '../src/parsers/feature.parser.js';
import { generateEventBus, generateEventHandlers, generateWorker } from '../src/generators/watt/event.gen.js';
import { generateWattProject } from '../src/generators/watt/index.js';

const feature = parseFeatureFromString(`
name: notifications
entities:
  - name: notification
    fields:
      - name: user_id
        type: string
      - name: message
        type: string
      - name: status
        type: enum
        values: [pending, sent, failed]
        default: pending

events:
  - name: user-signed-up
    payload:
      - name: user_id
        type: string
      - name: email
        type: string
    triggers:
      - worker: send-welcome-email

  - name: order-completed
    payload:
      - name: order_id
        type: string
      - name: amount
        type: number
    triggers:
      - worker: send-receipt

workers:
  - name: send-welcome-email
    steps:
      - load: notification
      - call: send-email
      - update: notification.status

  - name: send-receipt
    concurrency: 3
    steps:
      - load: notification
      - call: generate-receipt
`);

describe('Event Bus Generator', () => {
  it('generates typed event bus plugin', () => {
    const code = generateEventBus(feature);
    expect(code).toContain('EventEmitter');
    expect(code).toContain('FluskEventBus');
    expect(code).toContain('FluskEvents');
    expect(code).toContain("'user-signed-up'");
    expect(code).toContain("'order-completed'");
  });

  it('generates event constants', () => {
    const code = generateEventBus(feature);
    expect(code).toContain("USER_SIGNED_UP = 'user-signed-up'");
    expect(code).toContain("ORDER_COMPLETED = 'order-completed'");
  });

  it('generates payload types', () => {
    const code = generateEventBus(feature);
    expect(code).toContain('interface UserSignedUpPayload');
    expect(code).toContain('user_id: string');
    expect(code).toContain('email: string');
    expect(code).toContain('interface OrderCompletedPayload');
    expect(code).toContain('amount: number');
  });

  it('generates Fastify decorator', () => {
    const code = generateEventBus(feature);
    expect(code).toContain("app.decorate('events', bus)");
    expect(code).toContain('declare module');
    expect(code).toContain('events: FluskEventBus');
  });

  it('generates typed emit/on methods', () => {
    const code = generateEventBus(feature);
    expect(code).toContain('emit<K extends keyof FluskEvents>');
    expect(code).toContain('on<K extends keyof FluskEvents>');
  });
});

describe('Event Handler Generator', () => {
  it('generates handler plugin', () => {
    const code = generateEventHandlers(feature);
    expect(code).toContain('fastify-plugin');
    expect(code).toContain('app.events.on(USER_SIGNED_UP');
    expect(code).toContain('app.events.on(ORDER_COMPLETED');
  });

  it('imports worker functions', () => {
    const code = generateEventHandlers(feature);
    expect(code).toContain("import { sendWelcomeEmail }");
    expect(code).toContain("import { sendReceipt }");
  });

  it('calls workers on events', () => {
    const code = generateEventHandlers(feature);
    expect(code).toContain('await sendWelcomeEmail(app.platformatic, payload)');
    expect(code).toContain('await sendReceipt(app.platformatic, payload)');
  });

  it('has error handling', () => {
    const code = generateEventHandlers(feature);
    expect(code).toContain('catch (err)');
    expect(code).toContain('Worker failed');
  });
});

describe('Worker Generator', () => {
  it('generates worker function', () => {
    const code = generateWorker(feature.workers[0], feature);
    expect(code).toContain('export const sendWelcomeEmail');
    expect(code).toContain('PlatformaticApp');
    expect(code).toContain('payload: Record<string, unknown>');
  });

  it('generates load step', () => {
    const code = generateWorker(feature.workers[0], feature);
    expect(code).toContain('platformatic.entities.notification.find');
  });

  it('generates update step', () => {
    const code = generateWorker(feature.workers[0], feature);
    expect(code).toContain('platformatic.entities.notification.save');
  });
});

describe('Full Project with Events', () => {
  it('includes event files in project', () => {
    const files = generateWattProject([feature]);
    const paths = files.map((f) => f.path);

    expect(paths).toContain('apps/notifications/plugins/event-bus.ts');
    expect(paths).toContain('apps/notifications/plugins/event-handlers.ts');
    expect(paths).toContain('apps/notifications/workers/sendWelcomeEmail.ts');
    expect(paths).toContain('apps/notifications/workers/sendReceipt.ts');
  });

  it('plugin config loads plugins dir (which includes events)', () => {
    const files = generateWattProject([feature]);
    const config = files.find((f) => f.path === 'apps/notifications/platformatic.json');
    expect(config).toBeDefined();
    const data = JSON.parse(config!.content);
    expect(data.plugins.paths).toContain('./plugins');
  });
});
