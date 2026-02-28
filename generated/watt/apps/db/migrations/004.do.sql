CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id TEXT,
  rule_id TEXT,
  type TEXT,
  severity TEXT DEFAULT 'medium',
  title TEXT,
  message TEXT,
  context TEXT,
  status TEXT DEFAULT 'open',
  resolved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_alerts_org_id ON alerts (org_id);
CREATE INDEX IF NOT EXISTS idx_alerts_rule_id ON alerts (rule_id);
