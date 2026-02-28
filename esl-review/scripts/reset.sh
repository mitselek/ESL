#!/bin/bash
# Täielik andmete reset: DB seed + R2 failide sünk
# Käivitus: bash scripts/reset.sh
set -e

echo "=== 1. DB seed ==="
npx wrangler d1 execute esl-review --remote --file=migrations/seed.sql
npx wrangler d1 execute esl-review --remote --file=migrations/set-source-pdfs.sql

echo ""
echo "=== 2. R2 failide sünk ==="
for f in source-pdfs/*.pdf; do
  key=$(basename "$f")
  echo "  → $key"
  npx wrangler r2 object put "esl-pdfs/$key" --file="$f" --remote --content-type="application/pdf" 2>/dev/null
done

echo ""
echo "=== 3. p-07 review seed ==="
npx wrangler d1 execute esl-review --remote --file=migrations/seed-review-p-07.sql

echo ""
echo "=== Valmis! ==="
npx wrangler d1 execute esl-review --remote --command="SELECT id, title, status FROM pieces ORDER BY id;" 2>&1 | grep -A50 '"results"' | head -60
