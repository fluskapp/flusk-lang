-- Create alert_rules
CREATE TABLE IF NOT EXISTS alert_rules (
  id TEXT PRIMARY KEY,
  org_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  threshold TEXT,
  channels TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_org_id ON alert_rules (org_id);
