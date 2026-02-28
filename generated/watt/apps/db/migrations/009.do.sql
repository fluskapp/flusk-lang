CREATE TABLE IF NOT EXISTS bot_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slack_ts TEXT UNIQUE,
  channel TEXT,
  text TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bot_messages_slack_ts ON bot_messages (slack_ts);
CREATE INDEX IF NOT EXISTS idx_bot_messages_channel ON bot_messages (channel);
