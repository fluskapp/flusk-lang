CREATE TABLE IF NOT EXISTS knowledge_bases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  solution_id TEXT,
  name TEXT,
  type TEXT,
  source TEXT,
  content_hash TEXT,
  chunk_count TEXT DEFAULT 0,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_knowledge_bases_solution_id ON knowledge_bases (solution_id);
