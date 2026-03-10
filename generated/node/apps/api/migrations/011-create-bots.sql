-- Create bots
CREATE TABLE IF NOT EXISTS bots (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id INTEGER NOT NULL,
  runtime TEXT NOT NULL DEFAULT 'openclaw',
  runtime_url TEXT,
  runtime_status TEXT NOT NULL DEFAULT 'unknown',
  tier TEXT NOT NULL DEFAULT 'free',
  model TEXT,
  soul TEXT,
  identity TEXT,
  user_context TEXT,
  workspace_path TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bots_owner_id ON bots (owner_id);
