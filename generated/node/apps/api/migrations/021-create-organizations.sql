-- Create organizations
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'starter',
  max_seats INTEGER NOT NULL DEFAULT 50,
  api_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'trial',
  trial_ends_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

