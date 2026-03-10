-- Create telemetry_events
CREATE TABLE IF NOT EXISTS telemetry_events (
  id TEXT PRIMARY KEY,
  org_id INTEGER NOT NULL,
  device_id TEXT NOT NULL,
  trace_id TEXT NOT NULL,
  span_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  tool_name TEXT,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  cost_usd REAL NOT NULL DEFAULT 0,
  status_code INTEGER NOT NULL DEFAULT 200,
  is_approved INTEGER NOT NULL DEFAULT 0,
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
