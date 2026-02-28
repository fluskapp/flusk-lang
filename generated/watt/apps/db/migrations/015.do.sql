CREATE TABLE IF NOT EXISTS telemetry_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id TEXT,
  device_id TEXT,
  trace_id TEXT,
  span_id TEXT,
  provider TEXT,
  model TEXT,
  tool_name TEXT,
  input_tokens TEXT DEFAULT 0,
  output_tokens TEXT DEFAULT 0,
  latency_ms TEXT DEFAULT 0,
  cost_usd REAL DEFAULT 0,
  status_code TEXT DEFAULT 200,
  is_approved INTEGER DEFAULT 0,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_telemetry_events_org_id ON telemetry_events (org_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_events_device_id ON telemetry_events (device_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_events_trace_id ON telemetry_events (trace_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_events_provider ON telemetry_events (provider);
CREATE INDEX IF NOT EXISTS idx_telemetry_events_model ON telemetry_events (model);
CREATE INDEX IF NOT EXISTS idx_telemetry_events_tool_name ON telemetry_events (tool_name);
