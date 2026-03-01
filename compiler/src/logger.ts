import pino from 'pino';

export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

let rootLogger: pino.Logger = pino({ level: 'info' });

export const setLogLevel = (level: LogLevel): void => {
  rootLogger = pino({ level });
};

export const getLogger = (): pino.Logger => rootLogger;

export const createChildLogger = (name: string): pino.Logger => {
  return rootLogger.child({ component: name });
};
