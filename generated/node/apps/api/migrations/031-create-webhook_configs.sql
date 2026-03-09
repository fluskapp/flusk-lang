-- Create webhook_configs
CREATE TABLE IF NOT EXISTS webhook_configs (
  id TEXT PRIMARY KEY,
  bot_id TEXT NOT NULL UNIQUE,
  verify_token TEXT NOT NULL,
  api_secret TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'waha',
  webhook_url TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

