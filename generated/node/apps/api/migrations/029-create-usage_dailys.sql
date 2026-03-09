-- Create usage_dailys
CREATE TABLE IF NOT EXISTS usage_dailys (
  id TEXT PRIMARY KEY,
  org_id INTEGER NOT NULL,
  device_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  date TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  total_input_tokens INTEGER NOT NULL DEFAULT 0,
  total_output_tokens INTEGER NOT NULL DEFAULT 0,
  total_cost_usd REAL NOT NULL DEFAULT 0,
  total_latency_ms INTEGER NOT NULL DEFAULT 0,
  shadow_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_usage_dailys_org_id ON usage_dailys (org_id);
CREATE INDEX IF NOT EXISTS idx_usage_dailys_device_id ON usage_dailys (device_id);
CREATE INDEX IF NOT EXISTS idx_usage_dailys_provider ON usage_dailys (provider);
CREATE INDEX IF NOT EXISTS idx_usage_dailys_date ON usage_dailys (date);
