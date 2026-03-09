-- Create ai_tools
CREATE TABLE IF NOT EXISTS ai_tools (
  id TEXT PRIMARY KEY,
  org_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  approved INTEGER NOT NULL DEFAULT 0,
  detection_pattern TEXT,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_tools_org_id ON ai_tools (org_id);
