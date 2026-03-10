-- Create policys
CREATE TABLE IF NOT EXISTS policys (
  id TEXT PRIMARY KEY,
  account_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  target_role TEXT,
  target_department TEXT,
  rules TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_policys_account_id ON policys (account_id);
