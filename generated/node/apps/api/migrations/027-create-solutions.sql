-- Create solutions
CREATE TABLE IF NOT EXISTS solutions (
  id TEXT PRIMARY KEY,
  org_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'openclaw',
  llm_provider TEXT NOT NULL,
  llm_model TEXT NOT NULL,
  system_prompt TEXT,
  temperature REAL NOT NULL DEFAULT 0.7,
  max_tokens INTEGER NOT NULL DEFAULT 4096,
  tools_config TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by INTEGER NOT NULL,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_solutions_org_id ON solutions (org_id);
CREATE INDEX IF NOT EXISTS idx_solutions_created_by ON solutions (created_by);
