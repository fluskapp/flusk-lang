-- Create agent_devices
CREATE TABLE IF NOT EXISTS agent_devices (
  id TEXT PRIMARY KEY,
  org_id INTEGER NOT NULL,
  device_id TEXT NOT NULL UNIQUE,
  hostname TEXT NOT NULL,
  os TEXT NOT NULL,
  arch TEXT NOT NULL,
  agent_version TEXT NOT NULL,
  employee_email TEXT,
  last_seen_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_agent_devices_org_id ON agent_devices (org_id);
CREATE INDEX IF NOT EXISTS idx_agent_devices_employee_email ON agent_devices (employee_email);
