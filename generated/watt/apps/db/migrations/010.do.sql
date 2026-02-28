CREATE TABLE IF NOT EXISTS solutions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id TEXT,
  name TEXT,
  description TEXT,
  type TEXT DEFAULT 'openclaw',
  llm_provider TEXT,
  llm_model TEXT,
  system_prompt TEXT,
  temperature REAL DEFAULT 0.7,
  max_tokens TEXT DEFAULT 4096,
  tools_config TEXT,
  status TEXT DEFAULT 'draft',
  created_by TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_solutions_org_id ON solutions (org_id);
CREATE INDEX IF NOT EXISTS idx_solutions_created_by ON solutions (created_by);
