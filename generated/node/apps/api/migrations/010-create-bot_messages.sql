-- Create bot_messages
CREATE TABLE IF NOT EXISTS bot_messages (
  id TEXT PRIMARY KEY,
  slack_ts TEXT NOT NULL UNIQUE,
  channel TEXT NOT NULL,
  text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bot_messages_channel ON bot_messages (channel);
