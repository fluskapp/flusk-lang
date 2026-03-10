-- Create guard_policys
CREATE TABLE IF NOT EXISTS guard_policys (
  id TEXT PRIMARY KEY,
  assistant_id INTEGER NOT NULL,
  pii_detection INTEGER NOT NULL DEFAULT 1,
  cost_cap_cents INTEGER NOT NULL DEFAULT 5000,
  daily_cost_cap_cents INTEGER,
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 30,
  blocked_domains TEXT NOT NULL DEFAULT '[]',
  allowed_tools TEXT NOT NULL DEFAULT '["exec","read","write","edit","web_search"]',
  blocked_tools TEXT NOT NULL DEFAULT '["browser"]',
  require_approval_tools TEXT NOT NULL DEFAULT '["send_email","send_message","post_social"]',
  intent_matching INTEGER NOT NULL DEFAULT 1,
  sandbox_level TEXT NOT NULL DEFAULT 'standard',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_guard_policys_assistant_id ON guard_policys (assistant_id);
