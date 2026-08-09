/**
 * Recover the remote migration history into supabase/migrations/, verbatim.
 *
 * ----------------------------------------------------------------- why this exists
 *
 * The LMS schema was built through the Supabase MCP's `apply_migration`, which
 * writes the remote history table and nothing else. So for the first fifteen
 * migrations the repo held no record of its own database: no `.sql` files, no
 * `supabase/` directory, and a `src/lib/supabase/types.ts` that was a
 * hand-maintained guess at what production actually looked like.
 *
 * The bodies were never lost. `supabase_migrations.schema_migrations.statements`
 * keeps the full text of every migration, comments included, and those comments
 * are most of this schema's documentation — the argument for `user_roles` as a
 * table, the reason `my_seat()` is a definer function, the three separate
 * occasions a REVOKE looked applied and was not. `supabase db pull` would have
 * squashed all fifteen into one `remote_schema.sql` and dropped every line of it.
 * This script keeps the split and the prose.
 *
 * ------------------------------------------------------------------------- usage
 *
 *   SUPABASE_DB_URL='postgresql://postgres.<ref>:<password>@<host>:6543/postgres' \
 *     node scripts/pull-migration-history.mjs
 *
 * The connection string is on the Supabase dashboard under Project Settings →
 * Database → Connection string (use the pooler, port 6543). It contains the
 * database password, so pass it inline or via `.env.local`, never as an argument
 * that lands in shell history.
 *
 * Existing files are skipped rather than overwritten, so running this after new
 * migrations have been authored locally is safe.
 */

import { writeFile, readdir, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "supabase", "migrations");

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error(
    "SUPABASE_DB_URL is not set.\n\n" +
      "  Project Settings → Database → Connection string → Transaction pooler\n" +
      "  SUPABASE_DB_URL='postgresql://...' node scripts/pull-migration-history.mjs\n"
  );
  process.exit(1);
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

const { rows } = await client.query(
  `select version, name, statements
     from supabase_migrations.schema_migrations
    order by version`
);
await client.end();

await mkdir(OUT, { recursive: true });
const existing = new Set(await readdir(OUT).catch(() => []));

let written = 0;
let skipped = 0;

for (const row of rows) {
  /* The CLI's own naming: <version>_<name>.sql. Matching it is what lets
     `supabase migration list` line the local files up against the remote
     history instead of reporting fifteen phantom pending migrations. */
  const file = `${row.version}_${row.name ?? "unnamed"}.sql`;

  if (existing.has(file)) {
    skipped += 1;
    continue;
  }

  /* `statements` is text[]. Each element is one statement as the CLI sent it;
     joining on a blank line reproduces a readable file rather than one line. */
  const body = (row.statements ?? []).join("\n\n").trimEnd();
  await writeFile(join(OUT, file), body + "\n", "utf8");
  written += 1;
  console.log(`  wrote ${file} (${body.length} chars)`);
}

console.log(
  `\n${written} recovered, ${skipped} already present, ${rows.length} in the remote history.\n` +
    "Verify with:  npx supabase migration list  — local and remote should match, with nothing pending."
);
