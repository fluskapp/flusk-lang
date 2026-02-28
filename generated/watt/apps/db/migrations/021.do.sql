CREATE TABLE IF NOT EXISTS webhook_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bot_id TEXT UNIQUE,
  verify_token TEXT,
  api_secret TEXT,
  provider TEXT DEFAULT 'waha',
  webhook_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_configs_bot_id ON webhook_configs (bot_id);
