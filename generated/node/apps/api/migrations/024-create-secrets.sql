-- Create secrets
CREATE TABLE IF NOT EXISTS secrets (
  id TEXT PRIMARY KEY,
  account_id INTEGER NOT NULL,
  assistant_id INTEGER,
  key TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,
  provider TEXT,
  expires_at TEXT,
  rotated_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_secrets_account_id ON secrets (account_id);
CREATE INDEX IF NOT EXISTS idx_secrets_assistant_id ON secrets (assistant_id);
