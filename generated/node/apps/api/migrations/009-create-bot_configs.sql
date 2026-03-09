-- Create bot_configs
CREATE TABLE IF NOT EXISTS bot_configs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL UNIQUE,
  bot_token TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

