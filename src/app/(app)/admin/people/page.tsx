import type { Metadata } from "next";
import { Avatar } from "@/components/lms/avatar";
import { Empty } from "@/components/lms/ui";
import { listPeople } from "@/lib/lms/admin";
import { grantRole, revokeRole, assignInstructor } from "@/app/actions/admin";
import { getAdminCatalog as getCatalog } from "@/lib/catalog";
import type { AppRole } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "People", robots: { index: false, follow: false } };

/**
 * Who holds what.
 *
 * Every role grant, instructor assignment and seat binding on this platform has
 * been a hand-typed UPDATE against production by one person. Nobody could answer
 * "who can read learner submissions today" without querying the database,
 * revocation depended on somebody remembering, and there was no record of who
 * granted what or when — an operational and a data-protection problem at once,
 * given instructors read learners' written work.
 *
 * ------------------------------------------------------------- three things
 *
 * The student role is not offered: it is granted by the `handle_new_user`
 * trigger on sign-up and refused by `user_roles_guard` on delete, so a toggle
 * for it would be a control that always fails.
 *
 * Assigning a course grants the instructor role in the same action. An
 * assignment without the role is invisible — `teaches_course()` checks
 * `has_role` first — so the person would be assigned and still see an empty
 * console with nothing explaining why.
 *
 * Revoking your own admin role, or the last one, is refused by the trigger
 * rather than by hiding the button. Recovery is raw SQL against production, and
 * a guard in the database also protects the SQL editor at two in the morning,
 * which is where the mistake would actually be made.
 */

const GRANTABLE: readonly AppRole[] = ["instructor", "judge", "admin"];

export default async function AdminPeople() {
  const people = await listPeople();
  /* Drafts included: an instructor can be assigned to a course before it is
     published, which is how a course gets built by somebody other than an admin. */
  const catalog = await getCatalog();

  return (
    <>
      <h1 className="t-h2 text-ink">People</h1>
      <p className="t-body-sm mt-1.5 max-w-[62ch] text-ink-secondary">
        {people.length} account{people.length === 1 ? "" : "s"}. Everyone gets the student role on
        sign-up; the rest are granted here.
      </p>

      {people.length === 0 ? (
        <div className="mt-6">
          <Empty title="Nobody has signed up yet">
            Accounts appear here the moment somebody confirms their email.
          </Empty>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {people.map((p) => {
            const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || "No name";
            const assigned = new Set(p.courses.map((c) => c.course_id));

            return (
              <li
                key={p.id}
                className="rounded-[var(--radius-feature)] border border-line bg-surface p-4"
              >
                <div className="flex flex-wrap items-start gap-3.5">
                  <Avatar name={p.first_name ?? name} email={p.email} url={p.avatar_url} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="t-body-sm text-ink">{name}</p>
                    <p className="t-meta text-ink-muted">{p.email}</p>
                  </div>
                  <p className="t-meta text-ink-muted">
                    {p.enrollments} enrolment{p.enrollments === 1 ? "" : "s"}
                  </p>
                </div>

                {/* -------------------------------------------------- roles */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="t-label text-ink-muted">Roles</span>
                  {GRANTABLE.map((role) => {
                    const held = p.roles.includes(role);
                    return (
                      <form key={role} action={held ? revokeRole : grantRole}>
                        <input type="hidden" name="userId" value={p.id} />
                        <input type="hidden" name="role" value={role} />
                        <button
                          type="submit"
                          aria-pressed={held}
                          className={`t-meta inline-flex min-h-[32px] items-center rounded-full border px-3 capitalize transition-colors ${
                            held
                              ? "border-accent bg-accent-tint text-accent"
                              : "border-line-control text-ink-secondary hover:border-accent hover:text-accent"
                          }`}
                        >
                          {role}
                        </button>
                      </form>
                    );
                  })}
                  {p.roles.includes("student") ? (
                    <span className="t-meta text-ink-muted">· student since sign-up</span>
                  ) : null}
                </div>

                {/* --------------------------------------------- assignments */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="t-label text-ink-muted">Teaches</span>
                  {catalog.map((c) => {
                    const on = assigned.has(c.id);
                    return (
                      <form key={c.id} action={assignInstructor}>
                        <input type="hidden" name="userId" value={p.id} />
                        <input type="hidden" name="courseId" value={c.id} />
                        <input type="hidden" name="kind" value="lead" />
                        {on ? <input type="hidden" name="remove" value="1" /> : null}
                        <button
                          type="submit"
                          aria-pressed={on}
                          title={c.title}
                          className={`t-meta inline-flex min-h-[32px] items-center rounded-full border px-3 transition-colors ${
                            on
                              ? "border-accent bg-accent-tint text-accent"
                              : "border-line-control text-ink-secondary hover:border-accent hover:text-accent"
                          }`}
                        >
                          {c.badge}
                        </button>
                      </form>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
