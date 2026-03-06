-- Lisa lähtefailid noodidele, kus PDF olemas R2 bucketis (esl-pdfs)
-- Käivitus: wrangler d1 execute esl-review --remote --file=migrations/set-source-pdfs.sql

-- I OSA
UPDATE pieces SET source_pdf_url = '/pdf/laulu-voim-src.pdf', status = 'lähtefail' WHERE id = 'p-01';

-- II OSA (pulmalaulud)
UPDATE pieces SET source_pdf_url = '/pdf/millal-saame-sinna-maale-src.pdf', status = 'lähtefail' WHERE id = 'p-07';
UPDATE pieces SET source_pdf_url = '/pdf/sooge-langud-src.pdf', status = 'lähtefail' WHERE id = 'p-08';
UPDATE pieces SET source_pdf_url = '/pdf/petis-peiu-src.pdf', status = 'lähtefail' WHERE id = 'p-09';
UPDATE pieces SET source_pdf_url = '/pdf/palju-veini-src.pdf', status = 'lähtefail' WHERE id = 'p-10';
UPDATE pieces SET source_pdf_url = '/pdf/ei-voi-onneta-elada-src.pdf', status = 'lähtefail' WHERE id = 'p-11';
UPDATE pieces SET source_pdf_url = '/pdf/kohus-koju-minna-src.pdf', status = 'lähtefail' WHERE id = 'p-12';

-- I OSA (lisa)
UPDATE pieces SET source_pdf_url = '/pdf/valgust-src.pdf', status = 'lähtefail' WHERE id = 'p-06';

-- IV OSA
UPDATE pieces SET source_pdf_url = '/pdf/mu-suda-arka-ules-src.pdf', status = 'lähtefail' WHERE id = 'p-14';
UPDATE pieces SET source_pdf_url = '/pdf/mesipuu-src.pdf', status = 'lähtefail' WHERE id = 'p-18';
UPDATE pieces SET source_pdf_url = '/pdf/siin-meie-seltsis-src.pdf', status = 'lähtefail' WHERE id = 'p-20';
