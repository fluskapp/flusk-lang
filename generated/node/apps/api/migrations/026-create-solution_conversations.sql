-- Create solution_conversations
CREATE TABLE IF NOT EXISTS solution_conversations (
  id TEXT PRIMARY KEY,
  deployment_id INTEGER NOT NULL,
  org_id INTEGER NOT NULL,
  user_identifier TEXT NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 0,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd REAL NOT NULL DEFAULT 0,
  satisfaction INTEGER,
  last_message_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_solution_conversations_deployment_id ON solution_conversations (deployment_id);
CREATE INDEX IF NOT EXISTS idx_solution_conversations_org_id ON solution_conversations (org_id);
CREATE INDEX IF NOT EXISTS idx_solution_conversations_user_identifier ON solution_conversations (user_identifier);
