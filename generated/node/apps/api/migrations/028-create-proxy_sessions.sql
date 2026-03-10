-- Create proxy_sessions
CREATE TABLE IF NOT EXISTS proxy_sessions (
  id TEXT PRIMARY KEY,
  bot_id INTEGER NOT NULL,
  session_key TEXT NOT NULL UNIQUE,
  channel TEXT NOT NULL,
  chat_type TEXT NOT NULL DEFAULT 'direct',
  display_name TEXT,
  model TEXT,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  total_cost_usd REAL NOT NULL DEFAULT 0,
  message_count INTEGER NOT NULL DEFAULT 0,
  last_activity TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_proxy_sessions_bot_id ON proxy_sessions (bot_id);
