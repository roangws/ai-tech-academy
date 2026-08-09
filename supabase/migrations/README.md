# Migrations

Every schema change from now on is a file in this directory, applied with
`npm run db:push`. That is the whole rule, and it exists because the schema
previously had no representation in version control at all.

## How it got that way

The LMS schema was built through the Supabase MCP's `apply_migration` tool. That
writes the remote `supabase_migrations.schema_migrations` table and nothing
else, so fifteen migrations were applied to production without a single `.sql`
file landing in the repo. `src/lib/supabase/types.ts` was a hand-maintained
guess at the result, and its header claimed a `npm run db:types` script that did
not exist.

Nothing was lost. Postgres still holds the verbatim text of all fifteen,
comments included, and those comments are most of this schema's documentation.

## Recovering the first fifteen

Not yet done, because it needs the database password, which is not in this repo
and should not be:

```bash
SUPABASE_DB_URL='postgresql://postgres.gusexlvelgmgnecvytxf:<password>@<host>:6543/postgres' \
  npm run db:history
```

Connection string: Supabase dashboard → Project Settings → Database →
Connection string → **Transaction pooler** (port 6543).

The script writes one `<version>_<name>.sql` per remote migration, matching the
CLI's naming so `npx supabase migration list` lines the local files up against
the remote history instead of reporting fifteen phantom pending migrations. It
skips files that already exist, so it is safe to run after new migrations have
been authored here.

`supabase db pull` is deliberately **not** the tool for this: it squashes
everything into one `remote_schema.sql` and discards the fifteen-way split and
every comment.

The fifteen, in order:

| Version | Name |
|---|---|
| 20260809001433 | lms_enums_and_identity |
| 20260809001449 | lms_catalog |
| 20260809001506 | lms_learning_records |
| 20260809001532 | lms_instruction_and_judging |
| 20260809001617 | lms_row_level_security |
| 20260809005451 | lms_state_guards_and_policy_hardening |
| 20260809005535 | lms_constraints_indexes_and_atomic_sheet_save |
| 20260809011427 | lms_column_grants_actually_applied |
| 20260809011501 | lms_my_seat_rpc |
| 20260809011625 | lms_revoke_rpc_execute_on_helpers |
| 20260809011710 | lms_function_execute_from_public |
| 20260809021431 | lms_fix_feedback_constraint_blocks_instructor_deletion |
| 20260809021505 | lms_outcome_rows_guard_allows_cascade |
| 20260809025314 | lms_lesson_bodies_and_avatars |
| 20260809030203 | lms_grant_update_avatar_url |

Three of those names are the schema telling on itself:
`lms_column_grants_actually_applied`, `lms_revoke_rpc_execute_on_helpers` and
`lms_function_execute_from_public` all exist because an earlier privilege change
returned success without changing anything.

## House rules for a new migration

1. **One concern per file**, named for what it does.
2. **Keep the comments.** They are the register that records why a decision was
   made; the next person reading `my_seat()` needs to know it exists because
   `SELECT` on `judge_seats.user_id` is revoked, not because someone liked RPCs.
3. **End the file with its own verification `select`.** `20260809030203` sets
   the precedent. A `GRANT` or `REVOKE` returning success is not evidence it
   applied — this schema has been bitten by that three times. Assert with
   `has_table_privilege`, `has_column_privilege` or `has_function_privilege`.
4. **Every new table in `public` starts with ALL privileges granted to `anon`.**
   `pg_default_acl` is configured that way, so RLS is the only thing standing
   between an anonymous holder of the publishable key and your table. For
   anything holding per-user data, `revoke all ... from anon` explicitly.
5. **Helpers have `EXECUTE` revoked from `anon`.** A policy written
   `to anon, authenticated` that calls one will throw *permission denied* for
   every signed-out reader. Grant execute to `anon` deliberately, then probe it
   unauthenticated with the publishable key.
6. **Prefer `SECURITY INVOKER`.** Reach for `SECURITY DEFINER` only when a
   column grant makes the query impossible, and then put the authorisation
   check *inside* the function and `revoke execute ... from public` — not from
   `anon`, because `PUBLIC` holds execute on every new function by default.
