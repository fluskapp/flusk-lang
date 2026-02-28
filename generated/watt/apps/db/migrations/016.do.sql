CREATE TABLE IF NOT EXISTS ai_tools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id TEXT,
  name TEXT,
  provider TEXT,
  category TEXT DEFAULT 'other',
  approved INTEGER DEFAULT 0,
  detection_pattern TEXT,
  first_seen_at TEXT,
  last_seen_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ai_tools_org_id ON ai_tools (org_id);
