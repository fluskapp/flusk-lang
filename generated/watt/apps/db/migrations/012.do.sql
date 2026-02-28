CREATE TABLE IF NOT EXISTS deployments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  solution_id TEXT,
  org_id TEXT,
  channel TEXT,
  channel_config TEXT,
  status TEXT DEFAULT 'active',
  instance_id TEXT UNIQUE,
  health_status TEXT DEFAULT 'unknown',
  last_health_check TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_deployments_solution_id ON deployments (solution_id);
CREATE INDEX IF NOT EXISTS idx_deployments_org_id ON deployments (org_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_deployments_instance_id ON deployments (instance_id);
