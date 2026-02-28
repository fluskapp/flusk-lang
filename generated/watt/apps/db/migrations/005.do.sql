CREATE TABLE IF NOT EXISTS organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  slug TEXT UNIQUE,
  plan TEXT DEFAULT 'starter',
  max_seats TEXT DEFAULT 50,
  api_key TEXT UNIQUE,
  status TEXT DEFAULT 'trial',
  trial_ends_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_slug ON organizations (slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_api_key ON organizations (api_key);
