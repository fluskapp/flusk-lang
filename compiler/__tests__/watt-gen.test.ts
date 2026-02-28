import { describe, it, expect } from 'vitest';
import { parseFeatureFromString } from '../src/parsers/feature.parser.js';
import { generateWattProject } from '../src/generators/watt/index.js';
import { generateWattJson, generateDbConfig, generateApiServiceConfig } from '../src/generators/watt/config.gen.js';
import { generateFeatureMigrations } from '../src/generators/watt/migration.gen.js';
import { generatePlugin } from '../src/generators/watt/plugin.gen.js';
import { generateEntityType } from '../src/generators/watt/types.gen.js';
import { generateClient } from '../src/generators/watt/client.gen.js';
import { generateAllTests } from '../src/generators/watt/test.gen.js';

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
      - name: active
        type: boolean
        default: true

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
    input:
      - name: event
        type: object
        required: true

functions:
  - name: send-slack-message
    input:
      - name: channel
        type: string
      - name: text
        type: string
    uses: slack-api.postMessage

clients:
  - name: slack-api
    base_url: https://slack.com/api
    auth:
      type: bearer
      token: $SLACK_BOT_TOKEN
    methods:
      - name: postMessage
        method: POST
        path: /chat.postMessage

tests:
  integration:
    - name: webhook-flow
      steps:
        - post: /integrations/slack/webhook
          body: { event: { type: message } }
          expect: { status: 200 }
`);

describe('Watt Config Generator', () => {
  it('generates watt.json', () => {
    const config = generateWattJson([slackBot]);
    const data = JSON.parse(config.content);
    expect(data.$schema).toContain('watt');
    expect(data.autoload.path).toBe('apps');
    expect(data.cors).toBeDefined();
  });

  it('generates DB config with auth rules', () => {
    const config = generateDbConfig([slackBot]);
    const data = JSON.parse(config.content);
    expect(data.$schema).toContain('db');
    expect(data.db.connectionString).toBe('{DATABASE_URL}');
    expect(data.db.graphql).toBe(true);
    expect(data.db.openapi).toBe(true);
    expect(data.migrations.autoApply).toBe(true);
    expect(data.authorization.jwt.secret).toBe('{JWT_SECRET}');
  });

  it('generates API service config with DB client', () => {
    const config = generateApiServiceConfig([slackBot]);
    const data = JSON.parse(config.content);
    expect(data.$schema).toContain('service');
    expect(data.plugins.paths).toContain('./plugins');
    expect(data.clients[0].serviceId).toBe('db');
  });
});

describe('Watt Migration Generator', () => {
  it('generates Platformatic-style migrations', () => {
    const migrations = generateFeatureMigrations(slackBot);
    expect(migrations).toHaveLength(2);
    expect(migrations[0].number).toBe('001');
    expect(migrations[0].doSql).toContain('CREATE TABLE');
    expect(migrations[0].doSql).toContain('bot_configs');
    expect(migrations[0].undoSql).toContain('DROP TABLE');
    expect(migrations[1].doSql).toContain('bot_messages');
  });

  it('generates unique indexes and defaults', () => {
    const migrations = generateFeatureMigrations(slackBot);
    expect(migrations[0].doSql).toContain('workspace_id TEXT UNIQUE');
    expect(migrations[0].doSql).toContain('DEFAULT 1');
    expect(migrations[1].doSql).toContain("DEFAULT 'pending'");
  });
});

describe('Watt Plugin Generator', () => {
  it('generates Fastify plugin with routes and auth', () => {
    const plugin = generatePlugin(slackBot);
    expect(plugin).toContain('@generated');
    expect(plugin).toContain('fastify-plugin');
    expect(plugin).toContain("app.post('/integrations/slack/webhook'");
    expect(plugin).toContain('schema');
    expect(plugin).toContain('import slackWebhook');
  });
});

describe('Watt Types Generator', () => {
  it('generates entity interfaces', () => {
    const types = generateEntityType(slackBot.entities[0]);
    expect(types).toContain('interface BotConfig');
    expect(types).toContain('workspace_id: string');
    expect(types).toContain('interface BotConfigCreate');
  });

  it('generates enum types', () => {
    const types = generateEntityType(slackBot.entities[1]);
    expect(types).toContain("'pending' | 'sent' | 'failed'");
  });
});

describe('Watt Client Generator', () => {
  it('generates typed client', () => {
    const client = generateClient(slackBot.clients[0]);
    expect(client).toContain("BASE_URL = 'https://slack.com/api'");
    expect(client).toContain('postMessage');
  });
});

describe('Watt Test Generator', () => {
  it('generates CRUD and integration tests', () => {
    const tests = generateAllTests(slackBot);
    expect(tests.filter((t) => t.path.includes('.crud.test'))).toHaveLength(2);
    expect(tests.filter((t) => t.path.includes('webhook-flow'))).toHaveLength(1);
  });
});

describe('Full Watt Project Generation', () => {
  it('generates complete project with two-app architecture', () => {
    const files = generateWattProject([slackBot]);
    const paths = files.map((f) => f.path);

    // Root configs
    expect(paths).toContain('watt.json');
    expect(paths).toContain('.env.sample');
    expect(paths).toContain('package.json');
    expect(paths).toContain('Dockerfile');
    expect(paths).toContain('render.yaml');
    expect(paths).toContain('.gitignore');

    // DB app
    expect(paths).toContain('apps/db/platformatic.json');
    expect(paths).toContain('apps/db/package.json');
    expect(paths).toContain('apps/db/migrations/001.do.sql');
    expect(paths).toContain('apps/db/migrations/002.do.sql');

    // API app
    expect(paths).toContain('apps/api/platformatic.json');
    expect(paths).toContain('apps/api/package.json');
    expect(paths).toContain('apps/api/plugins/auth.ts');
    expect(paths).toContain('apps/api/plugins/slack-bot.ts');
    expect(paths).toContain('apps/api/functions/sendSlackMessage.ts');
    expect(paths).toContain('apps/api/clients/slack-api.ts');

    // Types
    expect(paths).toContain('types/BotConfig.ts');
    expect(paths).toContain('types/index.ts');
  });

  it('generates auth plugin with JWT + API key', () => {
    const files = generateWattProject([slackBot]);
    const auth = files.find((f) => f.path === 'apps/api/plugins/auth.ts');
    expect(auth).toBeDefined();
    expect(auth!.content).toContain('jwtVerify');
    expect(auth!.content).toContain('x-api-key');
    expect(auth!.content).toContain('/status');
  });
});
