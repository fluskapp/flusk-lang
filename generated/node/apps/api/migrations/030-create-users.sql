-- Create users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  account_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  department TEXT,
  job_title TEXT,
  sso_id TEXT,
  status TEXT NOT NULL DEFAULT 'invited',
  last_login_at TEXT,
  onboarding_complete INTEGER NOT NULL DEFAULT 0,
  flusk_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_account_id ON users (account_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_sso_id ON users (sso_id);
