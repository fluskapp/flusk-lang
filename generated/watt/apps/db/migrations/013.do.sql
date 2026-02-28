CREATE TABLE IF NOT EXISTS solution_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deployment_id TEXT,
  org_id TEXT,
  user_identifier TEXT,
  message_count TEXT DEFAULT 0,
  input_tokens TEXT DEFAULT 0,
  output_tokens TEXT DEFAULT 0,
  cost_usd REAL DEFAULT 0,
  satisfaction TEXT,
  last_message_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_solution_conversations_deployment_id ON solution_conversations (deployment_id);
CREATE INDEX IF NOT EXISTS idx_solution_conversations_org_id ON solution_conversations (org_id);
CREATE INDEX IF NOT EXISTS idx_solution_conversations_user_identifier ON solution_conversations (user_identifier);
