-- Existing inquiries stay skipped: enabling confirmations must not email past leads.
ALTER TABLE inquiries ADD COLUMN confirmation_status TEXT NOT NULL DEFAULT 'skipped'
  CHECK (confirmation_status IN ('skipped', 'pending', 'sending', 'sent', 'failed'));
ALTER TABLE inquiries ADD COLUMN confirmation_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE inquiries ADD COLUMN confirmation_started_at INTEGER NOT NULL DEFAULT 0;
ALTER TABLE inquiries ADD COLUMN confirmation_next_attempt_at INTEGER NOT NULL DEFAULT 0;
ALTER TABLE inquiries ADD COLUMN confirmation_lease_until INTEGER NOT NULL DEFAULT 0;
ALTER TABLE inquiries ADD COLUMN confirmation_message_id TEXT;
ALTER TABLE inquiries ADD COLUMN confirmation_error_code TEXT;
ALTER TABLE inquiries ADD COLUMN confirmation_accepted_at TEXT;
ALTER TABLE inquiries ADD COLUMN confirmation_delivery_status TEXT NOT NULL DEFAULT 'unreported';
ALTER TABLE inquiries ADD COLUMN confirmation_delivery_rank INTEGER NOT NULL DEFAULT 0;
ALTER TABLE inquiries ADD COLUMN confirmation_event_at TEXT;
ALTER TABLE inquiries ADD COLUMN confirmation_complained_at TEXT;
ALTER TABLE email_delivery_events ADD COLUMN message_kind TEXT NOT NULL DEFAULT 'notification'
  CHECK (message_kind IN ('notification', 'confirmation'));
CREATE INDEX inquiries_confirmation_queue ON inquiries (confirmation_status, confirmation_next_attempt_at);
CREATE INDEX inquiries_confirmation_message ON inquiries (confirmation_message_id);
