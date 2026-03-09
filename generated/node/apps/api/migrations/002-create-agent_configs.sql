-- Create agent_configs
CREATE TABLE IF NOT EXISTS agent_configs (
  id TEXT PRIMARY KEY,
  org_id INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  otel_endpoint TEXT NOT NULL,
  heartbeat_interval_ms INTEGER NOT NULL DEFAULT 60000,
  approved_tools TEXT NOT NULL,
  intercept_patterns TEXT NOT NULL,
  solutions TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_agent_configs_org_id ON agent_configs (org_id);
