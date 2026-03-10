-- Create memory_entrys
CREATE TABLE IF NOT EXISTS memory_entrys (
  id TEXT PRIMARY KEY,
  assistant_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  context TEXT,
  source_date TEXT NOT NULL,
  last_referenced TEXT,
  importance TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_memory_entrys_assistant_id ON memory_entrys (assistant_id);
