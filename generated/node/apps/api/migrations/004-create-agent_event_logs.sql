-- Create agent_event_logs
CREATE TABLE IF NOT EXISTS agent_event_logs (
  id TEXT PRIMARY KEY,
  org_id INTEGER NOT NULL,
  device_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_agent_event_logs_org_id ON agent_event_logs (org_id);
CREATE INDEX IF NOT EXISTS idx_agent_event_logs_device_id ON agent_event_logs (device_id);
