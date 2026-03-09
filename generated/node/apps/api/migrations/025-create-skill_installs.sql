-- Create skill_installs
CREATE TABLE IF NOT EXISTS skill_installs (
  id TEXT PRIMARY KEY,
  assistant_id INTEGER NOT NULL,
  skill_id TEXT NOT NULL,
  skill_version TEXT NOT NULL DEFAULT 'latest',
  config TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_skill_installs_assistant_id ON skill_installs (assistant_id);
