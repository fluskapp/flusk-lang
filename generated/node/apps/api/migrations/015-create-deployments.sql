-- Create deployments
CREATE TABLE IF NOT EXISTS deployments (
  id TEXT PRIMARY KEY,
  solution_id INTEGER NOT NULL,
  org_id INTEGER NOT NULL,
  channel TEXT NOT NULL,
  channel_config TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  instance_id TEXT NOT NULL UNIQUE,
  health_status TEXT NOT NULL DEFAULT 'unknown',
  last_health_check TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_deployments_solution_id ON deployments (solution_id);
CREATE INDEX IF NOT EXISTS idx_deployments_org_id ON deployments (org_id);
