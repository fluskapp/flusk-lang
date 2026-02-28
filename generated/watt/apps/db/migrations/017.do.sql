CREATE TABLE IF NOT EXISTS usage_dailys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id TEXT,
  device_id TEXT,
  provider TEXT,
  model TEXT,
  date TEXT,
  request_count TEXT DEFAULT 0,
  total_input_tokens TEXT DEFAULT 0,
  total_output_tokens TEXT DEFAULT 0,
  total_cost_usd REAL DEFAULT 0,
  total_latency_ms TEXT DEFAULT 0,
  shadow_count TEXT DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_usage_dailys_org_id ON usage_dailys (org_id);
CREATE INDEX IF NOT EXISTS idx_usage_dailys_device_id ON usage_dailys (device_id);
CREATE INDEX IF NOT EXISTS idx_usage_dailys_provider ON usage_dailys (provider);
CREATE INDEX IF NOT EXISTS idx_usage_dailys_date ON usage_dailys (date);
