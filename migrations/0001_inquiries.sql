CREATE TABLE inquiries (
  id TEXT PRIMARY KEY,
  fingerprint TEXT NOT NULL,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  contact_permission INTEGER NOT NULL CHECK (contact_permission = 1),
  attribution TEXT NOT NULL DEFAULT '{}',
  followup_status TEXT NOT NULL DEFAULT 'new',
  notification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (notification_status IN ('pending', 'sending', 'sent', 'failed')),
  notification_attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at INTEGER NOT NULL DEFAULT 0,
  lease_until INTEGER NOT NULL DEFAULT 0,
  email_message_id TEXT,
  last_error_code TEXT,
  notified_at TEXT
);

CREATE INDEX inquiry_notification_queue
  ON inquiries (notification_status, next_attempt_at, lease_until);

CREATE INDEX inquiry_followup_queue ON inquiries (followup_status, created_at);
