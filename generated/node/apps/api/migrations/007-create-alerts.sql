-- Create alerts
CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  org_id INTEGER NOT NULL,
  rule_id INTEGER,
  type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  context TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  resolved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_alerts_org_id ON alerts (org_id);
CREATE INDEX IF NOT EXISTS idx_alerts_rule_id ON alerts (rule_id);
