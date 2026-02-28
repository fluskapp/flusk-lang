CREATE TABLE IF NOT EXISTS agent_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id TEXT,
  version TEXT DEFAULT 1,
  otel_endpoint TEXT,
  heartbeat_interval_ms TEXT DEFAULT 60000,
  approved_tools TEXT,
  intercept_patterns TEXT,
  solutions TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_agent_configs_org_id ON agent_configs (org_id);
