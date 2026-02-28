-- Up
CREATE TABLE IF NOT EXISTS webhook_configs (
  id TEXT PRIMARY KEY,
  bot_id TEXT UNIQUE,
  verify_token TEXT,
  api_secret TEXT,
  provider TEXT DEFAULT 'waha',
  webhook_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Down
DROP TABLE IF EXISTS webhook_configs;
