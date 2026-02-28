-- Migration 0002: lisa source_pdf_url ja pageflow_matched pieces tabelisse
ALTER TABLE pieces ADD COLUMN source_pdf_url TEXT;
ALTER TABLE pieces ADD COLUMN pageflow_matched INTEGER DEFAULT 0;
