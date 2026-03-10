-- Create proxy_configs
CREATE TABLE IF NOT EXISTS proxy_configs (
  id TEXT PRIMARY KEY,
  bot_id INTEGER NOT NULL UNIQUE,
  pii_detection INTEGER NOT NULL DEFAULT 1,
  pii_masking INTEGER NOT NULL DEFAULT 1,
  cost_cap_daily_usd REAL,
  cost_cap_monthly_usd REAL,
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
  rate_limit_per_day INTEGER,
  allowed_tools TEXT,
  blocked_tools TEXT,
  allowed_domains TEXT,
  require_approval INTEGER NOT NULL DEFAULT 0,
  intent_validation INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

