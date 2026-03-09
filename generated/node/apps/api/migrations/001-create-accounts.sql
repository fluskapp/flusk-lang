-- Create accounts
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_email TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  llm_mode TEXT NOT NULL DEFAULT 'managed',
  llm_budget_cents INTEGER,
  status TEXT NOT NULL DEFAULT 'trial',
  trial_ends_at TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  sso_provider TEXT,
  sso_config TEXT,
  max_assistants INTEGER NOT NULL DEFAULT 1,
  max_users INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_accounts_owner_email ON accounts (owner_email);
