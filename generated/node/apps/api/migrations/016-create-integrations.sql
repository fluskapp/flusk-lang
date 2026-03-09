-- Create integrations
CREATE TABLE IF NOT EXISTS integrations (
  id TEXT PRIMARY KEY,
  assistant_id INTEGER NOT NULL,
  provider TEXT NOT NULL,
  scopes TEXT NOT NULL,
  access_token_ref TEXT NOT NULL,
  refresh_token_ref TEXT,
  token_expires_at TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  last_used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_integrations_assistant_id ON integrations (assistant_id);
