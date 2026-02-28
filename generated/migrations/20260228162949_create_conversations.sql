-- Up
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  bot_id TEXT,
  contact_phone TEXT,
  contact_name TEXT,
  status TEXT DEFAULT 'active',
  last_message_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Down
DROP TABLE IF EXISTS conversations;
