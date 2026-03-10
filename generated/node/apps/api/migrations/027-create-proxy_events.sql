-- Create proxy_events
CREATE TABLE IF NOT EXISTS proxy_events (
  id TEXT PRIMARY KEY,
  bot_id INTEGER NOT NULL,
  direction TEXT NOT NULL,
  event_type TEXT NOT NULL,
  channel TEXT,
  content_preview TEXT,
  details TEXT,
  cost_usd REAL NOT NULL DEFAULT 0,
  tokens INTEGER NOT NULL DEFAULT 0,
  model TEXT,
  blocked INTEGER NOT NULL DEFAULT 0,
  pii_found INTEGER NOT NULL DEFAULT 0,
  pii_types TEXT,
  latency_ms INTEGER,
  session_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_proxy_events_bot_id ON proxy_events (bot_id);
CREATE INDEX IF NOT EXISTS idx_proxy_events_session_id ON proxy_events (session_id);
