/**
 * Types for the watch command
 */

export interface WatchStartEvent {
  readonly type: 'start';
  readonly schemaDir: string;
}

export interface WatchChangeEvent {
  readonly type: 'change';
  readonly filePath: string;
}

export interface WatchSuccessEvent {
  readonly type: 'success';
  readonly filePath: string;
  readonly durationMs: number;
}

export interface WatchErrorEvent {
  readonly type: 'error';
  readonly filePath: string;
  readonly error: string;
}

export interface WatchStopEvent {
  readonly type: 'stop';
}

export type WatchEvent =
  | WatchStartEvent
  | WatchChangeEvent
  | WatchSuccessEvent
  | WatchErrorEvent
  | WatchStopEvent;

export interface WatchOptions {
  readonly schemaDir: string;
  readonly generatedDir: string;
  readonly onEvent: (event: WatchEvent) => void;
}
