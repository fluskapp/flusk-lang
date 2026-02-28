CREATE TABLE IF NOT EXISTS bot_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id TEXT UNIQUE,
  bot_token TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bot_configs_workspace_id ON bot_configs (workspace_id);
