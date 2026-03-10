-- Create guard_events
CREATE TABLE IF NOT EXISTS guard_events (
  id TEXT PRIMARY KEY,
  assistant_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  channel TEXT,
  details TEXT NOT NULL,
  cost_cents INTEGER,
  tokens_used INTEGER,
  model_used TEXT,
  blocked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_guard_events_assistant_id ON guard_events (assistant_id);
