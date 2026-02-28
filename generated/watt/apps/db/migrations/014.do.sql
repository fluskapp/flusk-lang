CREATE TABLE IF NOT EXISTS agent_devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id TEXT,
  device_id TEXT UNIQUE,
  hostname TEXT,
  os TEXT,
  arch TEXT,
  agent_version TEXT,
  employee_email TEXT,
  last_seen_at TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_agent_devices_org_id ON agent_devices (org_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_devices_device_id ON agent_devices (device_id);
CREATE INDEX IF NOT EXISTS idx_agent_devices_employee_email ON agent_devices (employee_email);
