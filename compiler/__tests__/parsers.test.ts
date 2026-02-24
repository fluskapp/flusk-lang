import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { parseEntity } from '../src/parsers/entity.parser.js';
import { parseFunction } from '../src/parsers/function.parser.js';
import { parseCommand } from '../src/parsers/command.parser.js';
import { parseRoute } from '../src/parsers/route.parser.js';
import { parseProvider } from '../src/parsers/provider.parser.js';
import { parseClient } from '../src/parsers/client.parser.js';

const examples = join(__dirname, '../../examples');

describe('Entity Parser', () => {
  it('parses alert-channel entity', () => {
    const entity = parseEntity(join(examples, 'alert-channel.entity.yaml'));
    expect(entity.name).toBe('AlertChannel');
    expect(entity.fields).toHaveLength(5);
    expect(entity.storage).toBe('postgres');
    expect(entity.capabilities).toContain('crud');
  });

  it('parses alert-event entity', () => {
    const entity = parseEntity(join(examples, 'alert-event.entity.yaml'));
    expect(entity.name).toBe('AlertEvent');
    expect(entity.fields.find((f) => f.name === 'severity')?.values).toEqual(['info', 'warning', 'error', 'critical']);
  });
});

describe('Function Parser', () => {
  it('parses dispatchAlert function', () => {
    const fn = parseFunction(join(examples, 'dispatch-alert.function.yaml'));
    expect(fn.name).toBe('dispatchAlert');
    expect(fn.steps).toHaveLength(3);
    expect(fn.steps[0].call).toBe('findEnabledAlertChannels');
    expect(fn.steps[1].action).toBe('filter');
    expect(fn.steps[2].action).toBe('forEach');
  });
});

describe('Command Parser', () => {
  it('parses alerts-setup command', () => {
    const cmd = parseCommand(join(examples, 'alerts-setup.command.yaml'));
    expect(cmd.name).toBe('alerts-setup');
    expect(cmd.args).toHaveLength(3);
    expect(cmd.action.call).toBe('createAlertChannel');
  });
});

describe('Route Parser', () => {
  it('parses alert-channels route', () => {
    const route = parseRoute(join(examples, 'alert-channels.route.yaml'));
    expect(route.name).toBe('alert-channels');
    expect(route.operations).toHaveLength(4);
    expect(route.auth).toBe('required');
  });
});

describe('Provider Parser', () => {
  it('parses slack provider', () => {
    const provider = parseProvider(join(examples, 'slack.provider.yaml'));
    expect(provider.name).toBe('slack');
    expect(provider.type).toBe('webhook');
    expect(provider.methods).toHaveLength(2);
  });
});

describe('Client Parser', () => {
  it('parses openai client', () => {
    const client = parseClient(join(examples, 'openai.client.yaml'));
    expect(client.name).toBe('openai');
    expect(client.endpoints).toHaveLength(2);
    expect(client.auth?.type).toBe('bearer');
  });

  it('parses endpoint with retry config', () => {
    const client = parseClient(join(examples, 'openai.client.yaml'));
    const ep = client.endpoints[0];
    expect(ep.retry?.maxAttempts).toBe(3);
    expect(ep.timeout).toBe(30000);
  });

  it('parses batch function', () => {
    const fn = parseFunction(join(examples, 'process-alert-batch.function.yaml'));
    expect(fn.name).toBe('processAlertBatch');
    expect(fn.inputs).toHaveLength(2);
    expect(fn.steps).toHaveLength(3);
  });
});
