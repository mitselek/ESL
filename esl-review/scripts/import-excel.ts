/**
 * Import Liisa's Excel review data into D1.
 *
 * Usage:
 *   npx tsx scripts/import-excel.ts
 *
 * Generates SQL files in /tmp/import-sql/ that are then executed via wrangler.
 */

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SOURCE = join(import.meta.dirname, '..', 'source-pdfs', 'liisa-review.json');
const OUT_DIR = '/tmp/import-sql';

// Review IDs per piece (from team-lead)
const REVIEW_IDS: Record<string, string> = {
  'p-01': 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a',
  'p-07': 'rev-p-07-mihkel',
  'p-08': 'rev-p-08-liisa',
  'p-09': '8b4072ea-99d7-40e7-b540-51509db8aa82',
  'p-10': 'f7859b2b-eac3-46ba-a768-35b8c4424fc8',
  'p-11': 'rev-p-11-liisa',
  'p-12': 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f',
};

// JSON param name → DB template_id (case-insensitive matching)
const PARAM_NAME_TO_TEMPLATE: Record<string, string> = {
  'noodikõrgused': 't-pv01',
  'pausid': 't-pv02',
  'rütmid': 't-pv03',
  'sõnad': 't-pv04',
  'strihhid': 't-pv05',
  'pidekaared': 't-pv06',
  'legatokaared': 't-pv07',
  'fermaadid': 't-pv08',
  'jagunemised': 't-pv09',
  'dünaamika tähised': 't-pv15',
  'dünaamika sõnadega': 't-pv16',
  'muud märgid': 't-pv17',
  'pealkiri': 't-wp01',
  'helilooja': 't-wp02',
  'sõnade autor': 't-wp03',
  'tempo tähis loo alguses': 't-wp04',
  'tempo, dünaamika jm tähised loo sees': 't-wp05',
  'täpsustavad tekstid loo sees': 't-wp06',
  'täpsustavad tekstid noodi all': 't-wp07',
  'helistik': 't-wp08',
  'taktimõõt': 't-wp09',
  'võtmed': 't-wp10',
  'häälte paigutus süsteemides': 't-pv10',
  'häälerühmade paigutus süsteemides': 't-pv10',
  'häälerühmade tähised süsteemi ees': 't-pv11',
  'kordusmärgid': 't-pv12',
  'kordusmärgid sõnadega': 't-pv13',
  'vormiosade tähised': 't-pv14',
};

// Voice name → voice_part_id suffix
const VOICE_SUFFIX: Record<string, string> = {
  's': 's',
  'a': 'a',
  't': 't',
  'b': 'b',
  'soolo': 'soolo',
};

// p-12 voice_parts have UUID IDs
const P12_VOICE_IDS: Record<string, string> = {
  's': '0cfe14e6-5ac1-4e4e-a7bd-b59ec898d6ba',
  'a': 'aaf99d34-5bcb-4605-bd09-8fd0972a8290',
  't': '53bf94fb-0028-42b0-a3f4-ceb7fa6e7724',
  'b': '175f7171-bfc1-416e-a65d-600cf9d85eca',
};

function getVoicePartId(pieceId: string, voice: string): string {
  const v = voice.toLowerCase();
  if (pieceId === 'p-12') {
    return P12_VOICE_IDS[v] ?? `vp-${pieceId}-${v}`;
  }
  return `vp-${pieceId}-${VOICE_SUFFIX[v] ?? v}`;
}

function getParamId(pieceId: string, templateId: string): string {
  // t-wp10 piece_params use pp- prefix (from our earlier INSERT)
  if (templateId === 't-wp10') {
    return `pp-${pieceId}-${templateId}`;
  }
  return `${pieceId}-${templateId}`;
}

function escSql(s: string): string {
  return s.replace(/'/g, "''");
}

interface PerVoiceEntry {
  parameeter: string;
  hääled: Record<string, { verdikt: string; tekst?: string }>;
}

interface WholePieceEntry {
  parameeter: string;
  verdikt: string;
  tekst?: string;
}

interface PieceData {
  title: string;
  excel_sheet: string;
  excel: {
    pealkiri: string;
    hääled: string[];
    per_voice: PerVoiceEntry[];
    whole_piece: WholePieceEntry[];
  };
}

function main() {
  const data = JSON.parse(readFileSync(SOURCE, 'utf8'));
  mkdirSync(OUT_DIR, { recursive: true });

  const pieces = data.pieces as Record<string, PieceData>;
  const summary: Record<string, number> = {};

  for (const [pieceId, piece] of Object.entries(pieces)) {
    const reviewId = REVIEW_IDS[pieceId];
    if (!reviewId) {
      console.log(`Skipping ${pieceId}: no review_id`);
      continue;
    }

    const entries: string[] = [];
    let entryCount = 0;

    // per_voice entries
    for (const pv of piece.excel.per_voice) {
      const templateId = PARAM_NAME_TO_TEMPLATE[pv.parameeter.toLowerCase()];
      if (!templateId) {
        console.error(`WARNING: no template mapping for per_voice "${pv.parameeter}" in ${pieceId}`);
        continue;
      }
      const paramId = getParamId(pieceId, templateId);

      for (const [voice, entry] of Object.entries(pv.hääled)) {
        const verdict = entry.verdikt?.toLowerCase();
        // Skip n/a entries (verdict NOT NULL constraint)
        if (!verdict || verdict === 'n/a' || verdict === '-') continue;

        const voicePartId = getVoicePartId(pieceId, voice);
        const id = `re-${pieceId}-${templateId}-${voice.toLowerCase()}`;
        const remarks = entry.tekst ? `'${escSql(entry.tekst)}'` : 'NULL';

        entries.push(`('${escSql(id)}', '${escSql(reviewId)}', '${escSql(paramId)}', '${escSql(voicePartId)}', '${escSql(verdict)}', ${remarks})`);
        entryCount++;
      }
    }

    // whole_piece entries
    for (const wp of piece.excel.whole_piece) {
      const templateId = PARAM_NAME_TO_TEMPLATE[wp.parameeter.toLowerCase()];
      if (!templateId) {
        console.error(`WARNING: no template mapping for whole_piece "${wp.parameeter}" in ${pieceId}`);
        continue;
      }
      const paramId = getParamId(pieceId, templateId);

      const verdict = wp.verdikt?.toLowerCase();
      if (!verdict || verdict === 'n/a' || verdict === '-') continue;

      const id = `re-${pieceId}-${templateId}`;
      const remarks = wp.tekst ? `'${escSql(wp.tekst)}'` : 'NULL';

      entries.push(`('${escSql(id)}', '${escSql(reviewId)}', '${escSql(paramId)}', NULL, '${escSql(verdict)}', ${remarks})`);
      entryCount++;
    }

    // Generate SQL file
    const deleteSQL = `DELETE FROM review_entries WHERE review_id = '${escSql(reviewId)}';`;

    let insertSQL = '';
    if (entries.length > 0) {
      insertSQL = `INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks) VALUES\n${entries.join(',\n')};`;
    }

    const sql = deleteSQL + '\n' + insertSQL;
    const outFile = join(OUT_DIR, `${pieceId}.sql`);
    writeFileSync(outFile, sql, 'utf8');

    console.log(`${pieceId}: ${entryCount} entries → ${outFile}`);
    summary[pieceId] = entryCount;
  }

  console.log('\nSummary:', JSON.stringify(summary, null, 2));
}

main();
