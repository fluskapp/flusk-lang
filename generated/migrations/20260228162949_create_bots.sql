-- Up
CREATE TABLE IF NOT EXISTS bots (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone_number TEXT UNIQUE,
  system_prompt TEXT,
  model TEXT DEFAULT 'gpt-4o',
  temperature REAL DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1024,
  active INTEGER DEFAULT 1,
  owner_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Down
DROP TABLE IF EXISTS bots;
