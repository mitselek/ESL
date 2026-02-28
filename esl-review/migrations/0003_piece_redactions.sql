-- Redaktsioonide ajalugu — iga PDF upload salvestatakse
CREATE TABLE IF NOT EXISTS piece_redactions (
  id TEXT PRIMARY KEY,
  piece_id TEXT NOT NULL REFERENCES pieces(id),
  url TEXT NOT NULL,
  label TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_piece_redactions_piece ON piece_redactions(piece_id);

-- Backfill: olemasolevad pdf_url'd → redactions tabelisse
INSERT INTO piece_redactions (id, piece_id, url, label, created_at)
SELECT lower(hex(randomblob(8))), id, pdf_url, 'v1', COALESCE(updated_at, datetime('now'))
FROM pieces WHERE pdf_url IS NOT NULL;
