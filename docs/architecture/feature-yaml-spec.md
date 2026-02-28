# Feature YAML Specification

## The Vision

One YAML file describes a complete feature. The compiler explodes it into sub-YAMLs, which generate all code. Zero hand-written code, ever.

```
slack-bot.feature.yaml (human/AI writes this)
    ↓ compiler: explode
├── entities/bot-config.entity.yaml
├── entities/bot-message.entity.yaml
├── functions/send-slack-message.function.yaml
├── routes/slack-webhook.route.yaml
├── events/slack-message-received.event.yaml
├── workers/process-slack-queue.worker.yaml
├── clients/slack-api.client.yaml
├── commands/slack-bot.command.yaml
├── views/slack-bot-settings.view.yaml
├── widgets/slack-message-card.widget.yaml
    ↓ compiler: generate
├── DB migrations + repositories
├── Route handlers + middleware + plugins
├── Worker processes + event handlers
├── CLI commands
├── SDK types + client
├── React pages + components
├── Tests (unit + integration)
├── Validation schemas
└── API docs
```

## Feature YAML Format

```yaml
# slack-bot.feature.yaml
name: slack-bot
description: Slack bot integration — receive webhooks, process messages, reply via AI
version: 1.0.0

# ── Data Layer ──────────────────────────────────
entities:
  - name: bot-config
    fields:
      - name: workspace_id
        type: string
        unique: true
      - name: bot_token
        type: string
        encrypted: true
      - name: channel_filter
        type: string[]
        default: []
      - name: active
        type: boolean
        default: true
    queries:
      - findByWorkspace: { by: workspace_id }

  - name: bot-message
    fields:
      - name: slack_ts
        type: string
        unique: true
      - name: channel
        type: string
        indexed: true
      - name: user_id
        type: string
      - name: text
        type: string
      - name: reply
        type: string
        nullable: true
      - name: status
        type: enum
        values: [pending, processing, sent, failed]
        default: pending
    queries:
      - findPending: { where: "status = 'pending'", limit: 50 }
      - findByChannel: { by: channel, order: created_at desc }

# ── API Layer ───────────────────────────────────
routes:
  - name: slack-webhook
    method: POST
    path: /integrations/slack/webhook
    auth: webhook-signature  # references middleware
    input:
      - name: event
        type: object
        required: true
    actions:
      - validate: slack-signature
      - create: bot-message
      - emit: slack-message-received
    response: { status: 200, body: { ok: true } }

  - name: slack-bot-settings
    method: GET
    path: /api/slack/settings
    auth: session
    loader: bot-config.findByWorkspace

  - name: update-slack-settings
    method: PUT
    path: /api/slack/settings
    auth: session
    input:
      - name: channel_filter
        type: string[]
      - name: active
        type: boolean
    actions:
      - update: bot-config

# ── Logic Layer ─────────────────────────────────
functions:
  - name: send-slack-message
    input:
      - name: channel
        type: string
      - name: text
        type: string
      - name: bot_token
        type: string
    output:
      type: object
      fields: [ok, ts, error]
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
    retry: { max: 3, backoff: exponential }
    steps:
      - load: bot-message
      - call: generate-ai-reply     # references another function
      - call: send-slack-message
      - update: bot-message.status -> sent

# ── External Layer ──────────────────────────────
clients:
  - name: slack-api
    base_url: https://slack.com/api
    auth:
      type: bearer
      token: $bot_token  # resolved from entity
    methods:
      - name: postMessage
        method: POST
        path: /chat.postMessage
        body: { channel, text }
      - name: getConversations
        method: GET
        path: /conversations.list

# ── Middleware ──────────────────────────────────
middleware:
  - name: slack-signature
    type: webhook-verify
    config:
      header: x-slack-signature
      secret: $SLACK_SIGNING_SECRET
      algorithm: hmac-sha256

# ── CLI Layer ───────────────────────────────────
commands:
  - name: slack-bot
    subcommands:
      - name: status
        description: Show bot connection status
        output: table
        data: bot-config.list
      - name: test
        description: Send a test message
        args:
          - name: channel
            type: string
            required: true
          - name: message
            type: string
            default: "Hello from Flusk!"
        action: send-slack-message

# ── UI Layer ────────────────────────────────────
views:
  - name: slack-bot-settings
    route: /settings/slack
    title: Slack Bot Settings
    loader: slack-bot-settings  # references route
    sections:
      - layout: { md: grid-2 }
        widgets:
          - type: stat-card
            source: data.config
            label: Status
            format: badge
          - type: stat-card
            source: data.messageCount
            label: Messages Processed

      - h2: Configuration
      - type: form
        fields:
          - name: channel_filter
            label: Channel Filter
            type: tags
          - name: active
            label: Active
            type: toggle
        submit: Save Settings
        action: update-slack-settings

      - h2: Recent Messages
      - source: data.messages
        columns: [channel, user_id, text, status, created_at]
        actions: [retry, delete]

widgets:
  - name: slack-message-card
    props:
      - name: message
        type: bot-message  # typed to entity!
    template:
      - layout: { direction: row, gap: 3 }
        widgets:
          - type: badge
            source: message.status
          - type: paragraph
            text: $message.text

# ── Tests ───────────────────────────────────────
tests:
  integration:
    - name: webhook-flow
      steps:
        - post: /integrations/slack/webhook
          body: { event: { type: message, text: "hello", channel: "C123" } }
          headers: { x-slack-signature: $computed }
          expect: { status: 200 }
        - wait: process-slack-queue
        - assert: bot-message.findByChannel("C123").length > 0

    - name: settings-crud
      steps:
        - auth: session
        - get: /api/slack/settings
          expect: { status: 200 }
        - put: /api/slack/settings
          body: { active: false }
          expect: { status: 200 }
```

## Change Detection

When a YAML changes, the compiler diffs against the previous version and knows exactly what to regenerate:

| Change | Effect |
|--------|--------|
| Add field to entity | Migration + repo + types + SDK + validation + tests |
| Remove field | Migration + repo + types + SDK + validation + tests + deprecation warning |
| Change field type | Migration + repo + types + SDK + validation + tests + **breaking change warning** |
| Add route | Route handler + middleware wire + SDK method + docs + tests |
| Add event | Event type + handler + worker wire + tests |
| Add view | Page component + loader + route registration |
| Add widget | Component + type + registry entry |
| Change function | Function + callers + tests |
| Add client method | Client + types + SDK |

## Compilation Phases

```
Phase 1: Parse
  feature.yaml → FeatureAST (validated, cross-referenced)

Phase 2: Explode
  FeatureAST → individual sub-YAMLs (entity.yaml, route.yaml, etc.)

Phase 3: Diff (incremental)
  Compare new YAMLs against existing → Changeset

Phase 4: Generate
  Changeset → code files (only changed files regenerated)

Phase 5: Migrate
  Entity changes → SQL migrations (auto-generated, reversible)

Phase 6: Test
  Generate test stubs from test definitions
```

## AI Workflow

```
Human: "Add Slack bot integration"
    ↓
AI reads: existing feature YAMLs (understand system)
AI writes: slack-bot.feature.yaml
    ↓
Compiler: validate → explode → diff → generate
    ↓
CI: test → deploy
```

The AI only needs to understand YAML. It never sees TypeScript, SQL, React, or any generated code. This means:
- **Fewer tokens** (YAML is 5-10x smaller than equivalent code)
- **Fewer mistakes** (can't break generated code)
- **Full consistency** (compiler enforces patterns)
- **Easy review** (human reviews one YAML, not 50 files)
