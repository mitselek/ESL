-- 1. Kasutajad (Google Auth, automaatselt loodud esimesel sisselogimisel)
CREATE TABLE users (
  id         TEXT PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  name       TEXT,
  picture    TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 2. Noodipalad (luuakse Wrangler CLI kaudu)
CREATE TABLE pieces (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  composer       TEXT,
  origin         TEXT,
  section        TEXT,
  status         TEXT DEFAULT 'teos',
  pdf_url        TEXT,              -- viimane PDF versioon (Google Drive URL)
  notes          TEXT,
  typesetter_id  TEXT REFERENCES users(id),
  reviewer_id    TEXT REFERENCES users(id),
  created_at     TEXT DEFAULT (datetime('now')),
  updated_at     TEXT DEFAULT (datetime('now'))
);

-- 3. Häälerühmad (konfigureeritav per noot)
CREATE TABLE voice_parts (
  id         TEXT PRIMARY KEY,
  piece_id   TEXT NOT NULL REFERENCES pieces(id),
  name       TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- 4. Parameetrite mallid (luuakse Wrangler CLI kaudu)
CREATE TABLE param_templates (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  scope      TEXT NOT NULL DEFAULT 'per_voice',
  sort_order INTEGER DEFAULT 0,
  is_default INTEGER DEFAULT 1
);

-- 5. Noodi-spetsiifilised parameetrid
CREATE TABLE piece_params (
  id          TEXT PRIMARY KEY,
  piece_id    TEXT NOT NULL REFERENCES pieces(id),
  template_id TEXT NOT NULL REFERENCES param_templates(id),
  sort_order  INTEGER DEFAULT 0,
  is_active   INTEGER DEFAULT 1
);

-- 6. Ülelugemise sessioonid
CREATE TABLE reviews (
  id          TEXT PRIMARY KEY,
  piece_id    TEXT NOT NULL REFERENCES pieces(id),
  reviewer    TEXT NOT NULL REFERENCES users(id),
  status      TEXT DEFAULT 'in_progress',
  pdf_url     TEXT NOT NULL,     -- selle review'ga seotud PDF versioon
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

-- 7. Üksikud hinnangud
CREATE TABLE review_entries (
  id            TEXT PRIMARY KEY,
  review_id     TEXT NOT NULL REFERENCES reviews(id),
  param_id      TEXT NOT NULL REFERENCES piece_params(id),
  voice_part_id TEXT REFERENCES voice_parts(id),
  verdict       TEXT NOT NULL,
  remarks       TEXT,            -- JSON: [{"bars":"5-8","text":"..."}]
  created_at    TEXT DEFAULT (datetime('now'))
);
