CREATE TABLE IF NOT EXISTS invites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id TEXT,
  email TEXT,
  role TEXT DEFAULT 'member',
  token TEXT UNIQUE,
  expires_at TEXT,
  accepted INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_invites_org_id ON invites (org_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_invites_token ON invites (token);
