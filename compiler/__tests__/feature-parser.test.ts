import { describe, it, expect } from 'vitest';
import { parseFeatureFromString } from '../src/parsers/feature.parser.js';

describe('Feature Parser', () => {
  it('parses minimal feature', () => {
    const feature = parseFeatureFromString(`
name: auth
description: Authentication feature
`);
    expect(feature.name).toBe('auth');
    expect(feature.entities).toHaveLength(0);
    expect(feature.routes).toHaveLength(0);
  });

  it('parses entities with fields', () => {
    const feature = parseFeatureFromString(`
name: blog
entities:
  - name: post
    fields:
      - name: title
        type: string
        required: true
      - name: body
        type: string
      - name: status
        type: enum
        values: [draft, published]
        default: draft
    queries:
      - findPublished: { where: "status = 'published'" }
      - findByTitle: { by: title }
`);
    expect(feature.entities).toHaveLength(1);
    expect(feature.entities[0].name).toBe('post');
    expect(feature.entities[0].fields).toHaveLength(3);
    expect(feature.entities[0].fields[0].required).toBe(true);
    expect(feature.entities[0].fields[2].values).toEqual(['draft', 'published']);
    expect(feature.entities[0].queries).toHaveLength(2);
    expect(feature.entities[0].queries![0].name).toBe('findPublished');
    expect(feature.entities[0].queries![1].by).toBe('title');
  });

  it('parses routes with actions', () => {
    const feature = parseFeatureFromString(`
name: blog
routes:
  - name: create-post
    method: POST
    path: /api/posts
    auth: session
    input:
      - name: title
        type: string
        required: true
    actions:
      - validate: post-input
      - create: post
      - emit: post-created
`);
    expect(feature.routes).toHaveLength(1);
    expect(feature.routes[0].actions).toHaveLength(3);
    expect(feature.routes[0].actions![0]).toEqual({ type: 'validate', target: 'post-input' });
    expect(feature.routes[0].actions![1]).toEqual({ type: 'create', target: 'post' });
  });

  it('parses functions', () => {
    const feature = parseFeatureFromString(`
name: notifications
functions:
  - name: send-email
    input:
      - name: to
        type: string
      - name: subject
        type: string
    output:
      type: object
      fields: [success, messageId]
    uses: smtp-client.send
`);
    expect(feature.functions).toHaveLength(1);
    expect(feature.functions[0].uses).toBe('smtp-client.send');
  });

  it('parses events with triggers', () => {
    const feature = parseFeatureFromString(`
name: blog
events:
  - name: post-created
    payload:
      - name: post_id
        type: string
    triggers:
      - worker: notify-subscribers
      - webhook: analytics
`);
    expect(feature.events).toHaveLength(1);
    expect(feature.events[0].triggers).toHaveLength(2);
    expect(feature.events[0].triggers![0]).toEqual({ type: 'worker', target: 'notify-subscribers' });
  });

  it('parses workers with steps', () => {
    const feature = parseFeatureFromString(`
name: blog
workers:
  - name: notify-subscribers
    concurrency: 3
    retry:
      max: 3
      backoff: exponential
    steps:
      - load: post
      - call: send-email
      - update: notification.status -> sent
`);
    expect(feature.workers).toHaveLength(1);
    expect(feature.workers[0].concurrency).toBe(3);
    expect(feature.workers[0].steps).toHaveLength(3);
  });

  it('parses full feature with all sections', () => {
    const feature = parseFeatureFromString(`
name: slack-bot
version: 1.0.0
entities:
  - name: bot-config
    fields:
      - name: token
        type: string
routes:
  - name: webhook
    method: POST
    path: /webhook
functions:
  - name: process-message
    input: []
events:
  - name: message-received
    payload: []
workers:
  - name: process-queue
    steps:
      - load: message
clients:
  - name: slack-api
    base_url: https://slack.com/api
    methods:
      - name: postMessage
        method: POST
        path: /chat.postMessage
middleware:
  - name: verify-signature
    type: webhook-verify
commands:
  - name: slack-bot
    subcommands:
      - name: status
        description: Show status
views:
  - name: settings
    route: /settings/slack
    title: Slack Settings
    sections: []
widgets:
  - name: message-card
    props:
      - name: message
        type: object
    template: {}
tests:
  integration:
    - name: webhook-flow
      steps:
        - post: /webhook
          body: { event: test }
          expect: { status: 200 }
        - wait: process-queue
        - assert: "bot-config.count > 0"
`);
    expect(feature.name).toBe('slack-bot');
    expect(feature.entities).toHaveLength(1);
    expect(feature.routes).toHaveLength(1);
    expect(feature.functions).toHaveLength(1);
    expect(feature.events).toHaveLength(1);
    expect(feature.workers).toHaveLength(1);
    expect(feature.clients).toHaveLength(1);
    expect(feature.middleware).toHaveLength(1);
    expect(feature.commands).toHaveLength(1);
    expect(feature.views).toHaveLength(1);
    expect(feature.widgets).toHaveLength(1);
    expect(feature.tests.integration).toHaveLength(1);
    expect(feature.tests.integration[0].steps).toHaveLength(3);
  });
});
