ALTER TABLE inquiries ADD COLUMN email_delivery_status TEXT NOT NULL DEFAULT 'unreported';
ALTER TABLE inquiries ADD COLUMN email_delivery_rank INTEGER NOT NULL DEFAULT 0;
ALTER TABLE inquiries ADD COLUMN email_event_at TEXT;
ALTER TABLE inquiries ADD COLUMN email_complained_at TEXT;

CREATE TABLE email_delivery_events (
  event_id TEXT PRIMARY KEY,
  inquiry_id TEXT NOT NULL REFERENCES inquiries(id),
  email_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  received_at TEXT NOT NULL
);
CREATE INDEX email_delivery_events_inquiry ON email_delivery_events(inquiry_id, occurred_at);
