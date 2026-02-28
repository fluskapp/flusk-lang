import { describe, it, expect } from 'vitest';
import { parseFeatureFromString } from '../src/parsers/feature.parser.js';
import { explodeFeature } from '../src/exploder/exploder.js';
import { writeExploded } from '../src/exploder/writer.js';
import yaml from 'js-yaml';

describe('Feature Exploder', () => {
  const slackBot = parseFeatureFromString(`
name: slack-bot
entities:
  - name: bot-config
    fields:
      - name: workspace_id
        type: string
        unique: true
      - name: bot_token
        type: string
    queries:
      - findByWorkspace: { by: workspace_id }

  - name: bot-message
    fields:
      - name: text
        type: string
      - name: status
        type: enum
        values: [pending, sent, failed]
        default: pending

routes:
  - name: slack-webhook
    method: POST
    path: /integrations/slack/webhook
    auth: webhook-signature
    actions:
      - validate: slack-signature
      - create: bot-message
      - emit: slack-message-received

  - name: get-settings
    method: GET
    path: /api/slack/settings
    auth: session

functions:
  - name: send-slack-message
    input:
      - name: channel
        type: string
      - name: text
        type: string
    uses: slack-api.postMessage

events:
  - name: slack-message-received
    payload:
      - name: message_id
        type: string
    triggers:
      - worker: process-slack-queue

workers:
  - name: process-slack-queue
    concurrency: 5
    retry:
      max: 3
      backoff: exponential
    steps:
      - load: bot-message
      - call: send-slack-message
      - update: bot-message.status -> sent

clients:
  - name: slack-api
    base_url: https://slack.com/api
    methods:
      - name: postMessage
        method: POST
        path: /chat.postMessage

middleware:
  - name: slack-signature
    type: webhook-verify
    config:
      header: x-slack-signature

commands:
  - name: slack-bot
    subcommands:
      - name: status
        description: Show status

views:
  - name: slack-settings
    route: /settings/slack
    title: Slack Settings
    sections:
      - h2: Configuration

widgets:
  - name: slack-message-card
    props:
      - name: message
        type: object
    template:
      type: badge
`);

  it('explodes all sections into files', () => {
    const result = explodeFeature(slackBot);
    expect(result.feature).toBe('slack-bot');

    const types = result.files.map((f) => f.type);
    expect(types).toContain('entity');
    expect(types).toContain('route');
    expect(types).toContain('function');
    expect(types).toContain('event');
    expect(types).toContain('worker');
    expect(types).toContain('client');
    expect(types).toContain('middleware');
    expect(types).toContain('command');
    expect(types).toContain('view');
    expect(types).toContain('widget');
  });

  it('generates correct file paths', () => {
    const result = explodeFeature(slackBot);
    const paths = result.files.map((f) => f.path);

    expect(paths).toContain('entities/bot-config.entity.yaml');
    expect(paths).toContain('entities/bot-message.entity.yaml');
    expect(paths).toContain('routes/slack-bot.route.yaml');
    expect(paths).toContain('functions/send-slack-message.function.yaml');
    expect(paths).toContain('functions/slack-webhook.function.yaml');
    expect(paths).toContain('functions/get-settings.function.yaml');
    expect(paths).toContain('events/slack-message-received.event.yaml');
    expect(paths).toContain('workers/process-slack-queue.worker.yaml');
    expect(paths).toContain('clients/slack-api.client.yaml');
    expect(paths).toContain('middlewares/slack-signature.middleware.yaml');
    expect(paths).toContain('commands/slack-bot.command.yaml');
    expect(paths).toContain('views/slack-settings.view.yaml');
    expect(paths).toContain('widgets/slack-message-card.widget.yaml');
  });

  it('generates 13 files total', () => {
    const result = explodeFeature(slackBot);
    // 2 entities + 1 route + 3 functions (1 explicit + 2 auto-handlers) + 1 event + 1 worker + 1 client + 1 middleware + 1 command + 1 view + 1 widget
    expect(result.files).toHaveLength(13);
  });

  it('entity YAML has correct structure', () => {
    const result = explodeFeature(slackBot);
    const entityFile = result.files.find((f) => f.path === 'entities/bot-config.entity.yaml')!;
    const data = yaml.load(entityFile.content) as Record<string, unknown>;

    expect(data.name).toBe('BotConfig');
    expect((data.fields as unknown[]).length).toBe(2);
    expect((data.queries as unknown[]).length).toBe(1);
  });

  it('entity generates SQL for queries', () => {
    const result = explodeFeature(slackBot);
    const entityFile = result.files.find((f) => f.path === 'entities/bot-config.entity.yaml')!;
    const data = yaml.load(entityFile.content) as Record<string, unknown>;
    const queries = data.queries as Array<{ name: string; sql: string }>;

    expect(queries[0].name).toBe('findByWorkspace');
    expect(queries[0].sql).toContain('WHERE workspace_id = ?');
  });

  it('route YAML has correct operations', () => {
    const result = explodeFeature(slackBot);
    const routeFile = result.files.find((f) => f.type === 'route')!;
    const data = yaml.load(routeFile.content) as Record<string, unknown>;

    expect(data.basePath).toBe('/api/slack-bot');
    expect((data.operations as unknown[]).length).toBe(2);
  });

  it('view YAML has page type', () => {
    const result = explodeFeature(slackBot);
    const viewFile = result.files.find((f) => f.type === 'view')!;
    const data = yaml.load(viewFile.content) as Record<string, unknown>;

    expect(data.type).toBe('page');
    expect(data.route).toBe('/settings/slack');
  });

  it('all files produce valid YAML', () => {
    const result = explodeFeature(slackBot);
    for (const file of result.files) {
      expect(() => yaml.load(file.content)).not.toThrow();
    }
  });
});

describe('Exploded Writer', () => {
  it('dry-run reports new files', () => {
    const feature = parseFeatureFromString(`
name: test-feature
entities:
  - name: test-entity
    fields:
      - name: id
        type: string
`);
    const exploded = explodeFeature(feature);
    const result = writeExploded(exploded, '/tmp/nonexistent-schema-dir', { dryRun: true });

    expect(result.written.length).toBe(1);
    expect(result.written[0]).toBe('entities/test-entity.entity.yaml');
  });
});
