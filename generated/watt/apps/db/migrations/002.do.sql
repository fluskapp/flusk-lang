CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bot_id TEXT,
  contact_phone TEXT,
  contact_name TEXT,
  status TEXT DEFAULT 'active',
  last_message_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_conversations_bot_id ON conversations (bot_id);
CREATE INDEX IF NOT EXISTS idx_conversations_contact_phone ON conversations (contact_phone);
