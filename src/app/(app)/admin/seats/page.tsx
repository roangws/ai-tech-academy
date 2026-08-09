import type { Metadata } from "next";
import { listSeats, listPeople } from "@/lib/lms/admin";
import { bindSeat } from "@/app/actions/admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Judge seats", robots: { index: false, follow: false } };

/**
 * The six seats on the review board, and who sits in them.
 *
 * Reading this list is the reason `admin_seats()` exists. `authenticated` has no
 * SELECT on `judge_seats.user_id` at all — it is a column whitelist and that
 * column is deliberately not in it, because `catalog_seats_read` is
 * `using (true)` and granting the column would publish every judge's identity to
 * every learner on the site. So this is a SECURITY DEFINER function with the
 * `is_admin()` check written inside it by hand.
 *
 * Binding goes through `bind_seat`, which also grants the judge role in the same
 * transaction: `holds_seat()` tests `has_role(uid, 'judge')` first, so a seat
 * bound to somebody without it is a seat that silently does nothing, and the
 * person would open the console, see nothing, and have no way to find out why.
 *
 * Every seat shows its current holder inline, so double-booking is visible at
 * the point of decision rather than after it.
 */
export default async function AdminSeats() {
  const [seats, people] = await Promise.all([listSeats(), listPeople()]);

  return (
    <>
      <h1 className="t-h2 text-ink">Judge seats</h1>
      <p className="t-body-sm mt-1.5 max-w-[62ch] text-ink-secondary">
        One seat per course, plus a learning-design seat that reads all five. Binding somebody
        grants them the judge role at the same time.
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        {seats.map((seat) => (
          <li
            key={seat.id}
            className="rounded-[var(--radius-feature)] border border-line bg-surface p-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div className="min-w-0">
                <p className="t-card-title text-ink">{seat.seat}</p>
                <p className="t-meta text-ink-muted">
                  {seat.reads_all_courses ? "Reads all five courses" : seat.reviews_label}
                </p>
              </div>
              <p className="t-meta text-ink-secondary">
                {seat.user_id ? (
                  <>
                    <span className="text-ink">{seat.holder_name ?? "Unnamed"}</span>
                    <span className="text-ink-muted"> · {seat.holder_email}</span>
                  </>
                ) : (
                  <span className="text-ink-muted">Nobody yet</span>
                )}
              </p>
            </div>

            <form action={bindSeat} className="mt-4 flex flex-wrap items-end gap-3">
              <input type="hidden" name="seatId" value={seat.id} />
              <label className="min-w-[240px] flex-1">
                <span className="t-field block text-ink-secondary">Bind to</span>
                <select
                  name="userId"
                  defaultValue={seat.user_id ?? ""}
                  className="t-body mt-1.5 h-11 w-full rounded-[var(--radius-control)] border border-line-control bg-surface px-3 text-ink transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
                >
                  <option value="">Nobody</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {[p.first_name, p.last_name].filter(Boolean).join(" ") || p.email} · {p.email}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="t-button h-11 rounded-[var(--radius-control)] bg-accent px-5 text-on-accent transition-colors hover:bg-accent-hover"
              >
                Save seat
              </button>
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}
