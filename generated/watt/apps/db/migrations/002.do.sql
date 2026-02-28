CREATE TABLE IF NOT EXISTS agent_event_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id TEXT,
  device_id TEXT,
  event_type TEXT,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_agent_event_logs_org_id ON agent_event_logs (org_id);
CREATE INDEX IF NOT EXISTS idx_agent_event_logs_device_id ON agent_event_logs (device_id);
