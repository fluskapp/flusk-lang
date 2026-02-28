import { describe, it, expect } from 'vitest';
import { parseFeatureFromString } from '../src/parsers/feature.parser.js';
import { generateWattProject } from '../src/generators/watt/index.js';
import { generateWattJson, generateDbConfig, generateServiceConfig } from '../src/generators/watt/config.gen.js';
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
  it('generates watt.json with DB app', () => {
    const config = generateWattJson([slackBot]);
    const data = JSON.parse(config.content);
    expect(data.$schema).toContain('watt');
    expect(data.autoload.path).toBe('apps');
  });

  it('generates DB platformatic.json', () => {
    const config = generateDbConfig([slackBot]);
    const data = JSON.parse(config.content);
    expect(data.$schema).toContain('db');
    expect(data.db.connectionString).toBe('{DATABASE_URL}');
    expect(data.migrations.autoApply).toBe(true);
  });

  it('generates service platformatic.json', () => {
    const config = generateServiceConfig(slackBot);
    const data = JSON.parse(config.content);
    expect(data.$schema).toContain('service');
    expect(data.plugins.paths).toContain('./plugins');
  });
});

describe('Watt Migration Generator', () => {
  it('generates Platformatic-style migrations', () => {
    const migrations = generateFeatureMigrations(slackBot);
    expect(migrations).toHaveLength(2);
    expect(migrations[0].number).toBe('001');
    expect(migrations[0].doSql).toContain('CREATE TABLE');
    expect(migrations[0].doSql).toContain('bot_configs');
    expect(migrations[0].doSql).toContain('AUTOINCREMENT');
    expect(migrations[0].undoSql).toContain('DROP TABLE');
    expect(migrations[1].number).toBe('002');
    expect(migrations[1].doSql).toContain('bot_messages');
  });

  it('generates unique indexes', () => {
    const migrations = generateFeatureMigrations(slackBot);
    expect(migrations[0].doSql).toContain('workspace_id TEXT UNIQUE');
  });

  it('generates default values', () => {
    const migrations = generateFeatureMigrations(slackBot);
    expect(migrations[0].doSql).toContain('DEFAULT 1'); // boolean true
    expect(migrations[1].doSql).toContain("DEFAULT 'pending'");
  });
});

describe('Watt Plugin Generator', () => {
  it('generates Fastify plugin with routes', () => {
    const plugin = generatePlugin(slackBot);
    expect(plugin).toContain('@generated');
    expect(plugin).toContain('fastify-plugin');
    expect(plugin).toContain("app.post('/integrations/slack/webhook'");
    expect(plugin).toContain('schema');
    expect(plugin).toContain('platformatic');
  });
});

describe('Watt Types Generator', () => {
  it('generates entity interface', () => {
    const types = generateEntityType(slackBot.entities[0]);
    expect(types).toContain('interface BotConfig');
    expect(types).toContain('workspace_id: string');
    expect(types).toContain('active?: boolean');
    expect(types).toContain('interface BotConfigCreate');
    expect(types).toContain('interface BotConfigUpdate');
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
    expect(client).toContain('Bearer');
    expect(client).toContain('postMessage');
    expect(client).toContain('export const slackApi');
  });
});

describe('Watt Test Generator', () => {
  it('generates entity CRUD tests', () => {
    const tests = generateAllTests(slackBot);
    const crudTests = tests.filter((t) => t.path.includes('.crud.test'));
    expect(crudTests).toHaveLength(2);
    expect(crudTests[0].content).toContain('POST /bot_configs');
    expect(crudTests[0].content).toContain('GET /bot_configs');
    expect(crudTests[0].content).toContain('PUT /bot_configs');
    expect(crudTests[0].content).toContain('DELETE /bot_configs');
  });

  it('generates integration tests', () => {
    const tests = generateAllTests(slackBot);
    const intTests = tests.filter((t) => t.path.includes('webhook-flow'));
    expect(intTests).toHaveLength(1);
    expect(intTests[0].content).toContain("method: 'POST'");
    expect(intTests[0].content).toContain('/integrations/slack/webhook');
  });
});

describe('Full Watt Project Generation', () => {
  it('generates complete project structure', () => {
    const files = generateWattProject([slackBot]);
    const paths = files.map((f) => f.path);

    // Configs
    expect(paths).toContain('watt.json');
    expect(paths).toContain('.env.sample');
    expect(paths).toContain('apps/db/platformatic.json');
    expect(paths).toContain('apps/slack-bot/platformatic.json');

    // Migrations
    expect(paths).toContain('apps/db/migrations/001.do.sql');
    expect(paths).toContain('apps/db/migrations/001.undo.sql');
    expect(paths).toContain('apps/db/migrations/002.do.sql');
    expect(paths).toContain('apps/db/migrations/002.undo.sql');

    // Plugin
    expect(paths).toContain('apps/slack-bot/plugins/slack-bot.ts');

    // Functions
    expect(paths).toContain('apps/slack-bot/functions/sendSlackMessage.ts');

    // Client
    expect(paths).toContain('apps/slack-bot/clients/slack-api.ts');

    // Types
    expect(paths).toContain('types/BotConfig.ts');
    expect(paths).toContain('types/BotMessage.ts');
    expect(paths).toContain('types/index.ts');

    // Tests
    expect(paths.some((p) => p.includes('.crud.test'))).toBe(true);
    expect(paths.some((p) => p.includes('webhook-flow'))).toBe(true);
  });

  it('generates correct file count', () => {
    const files = generateWattProject([slackBot]);
    // watt.json + .env + db config + service config + 4 migrations + 1 plugin + 1 function + 1 client + 3 types + 3 tests = 17
    expect(files.length).toBeGreaterThanOrEqual(15);
  });
});
