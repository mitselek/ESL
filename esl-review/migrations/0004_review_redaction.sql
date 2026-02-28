ALTER TABLE reviews ADD COLUMN redaction_id TEXT REFERENCES piece_redactions(id);
