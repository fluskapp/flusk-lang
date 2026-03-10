-- Create day_summarys
CREATE TABLE IF NOT EXISTS day_summarys (
  id TEXT PRIMARY KEY,
  assistant_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  summary_text TEXT NOT NULL,
  key_decisions TEXT,
  goals_progress TEXT,
  people_mentioned TEXT,
  personality_notes TEXT,
  things_to_remember TEXT,
  message_count INTEGER NOT NULL DEFAULT 0,
  action_count INTEGER NOT NULL DEFAULT 0,
  cost_cents INTEGER NOT NULL DEFAULT 0,
  guard_blocks INTEGER NOT NULL DEFAULT 0,
  pii_detections INTEGER NOT NULL DEFAULT 0,
  channels_used TEXT NOT NULL DEFAULT '[]',
  mood TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_day_summarys_assistant_id ON day_summarys (assistant_id);
CREATE INDEX IF NOT EXISTS idx_day_summarys_date ON day_summarys (date);
