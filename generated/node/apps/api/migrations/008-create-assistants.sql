-- Create assistants
CREATE TABLE IF NOT EXISTS assistants (
  id TEXT PRIMARY KEY,
  account_id INTEGER NOT NULL,
  user_id INTEGER,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  soul TEXT,
  identity TEXT,
  user_context TEXT,
  memory TEXT,
  llm_provider TEXT NOT NULL,
  llm_model TEXT NOT NULL DEFAULT 'claude-sonnet-4-20250514',
  temperature REAL NOT NULL DEFAULT 0.7,
  machine_tier TEXT NOT NULL,
  container_id TEXT,
  container_status TEXT NOT NULL DEFAULT 'pending',
  openclaw_version TEXT NOT NULL DEFAULT 'latest',
  tools_enabled TEXT NOT NULL DEFAULT '[]',
  sandbox_level TEXT NOT NULL DEFAULT 'standard',
  status TEXT NOT NULL DEFAULT 'provisioning',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_assistants_account_id ON assistants (account_id);
CREATE INDEX IF NOT EXISTS idx_assistants_user_id ON assistants (user_id);
CREATE INDEX IF NOT EXISTS idx_assistants_slug ON assistants (slug);
