-- Create schedules
CREATE TABLE IF NOT EXISTS schedules (
  id TEXT PRIMARY KEY,
  assistant_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  cron_expression TEXT,
  interval_ms INTEGER,
  prompt TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  last_run_at TEXT,
  next_run_at TEXT,
  run_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  delivery TEXT NOT NULL DEFAULT 'silent',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_schedules_assistant_id ON schedules (assistant_id);
