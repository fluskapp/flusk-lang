import { describe, it, expect } from 'vitest';
import { setLogLevel, getLogger, createChildLogger } from '../src/logger.js';

describe('logger', () => {
  it('creates a root logger with default info level', () => {
    const logger = getLogger();
    expect(logger.level).toBe('info');
  });

  it('allows setting log level', () => {
    setLogLevel('debug');
    const logger = getLogger();
    expect(logger.level).toBe('debug');
    setLogLevel('info'); // reset
  });

  it('creates child loggers with component name', () => {
    const child = createChildLogger('test-component');
    expect(child).toBeDefined();
    // Child logger should have bindings with component
    const bindings = child.bindings();
    expect(bindings.component).toBe('test-component');
  });

  it('supports silent level', () => {
    setLogLevel('silent');
    const logger = getLogger();
    expect(logger.level).toBe('silent');
    setLogLevel('info'); // reset
  });
});
