-- Up
CREATE TABLE IF NOT EXISTS bot_messages (
  id TEXT PRIMARY KEY,
  slack_ts TEXT UNIQUE,
  channel TEXT,
  text TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Down
DROP TABLE IF EXISTS bot_messages;
