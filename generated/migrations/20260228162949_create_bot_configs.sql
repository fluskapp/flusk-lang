-- Up
CREATE TABLE IF NOT EXISTS bot_configs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT UNIQUE,
  bot_token TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Down
DROP TABLE IF EXISTS bot_configs;
