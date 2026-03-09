-- Create channels
CREATE TABLE IF NOT EXISTS channels (
  id TEXT PRIMARY KEY,
  assistant_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  config TEXT NOT NULL,
  external_id TEXT,
  last_message_at TEXT,
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_channels_assistant_id ON channels (assistant_id);
CREATE INDEX IF NOT EXISTS idx_channels_external_id ON channels (external_id);
