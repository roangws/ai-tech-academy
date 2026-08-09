import type { Metadata } from "next";
import Link from "next/link";
import { Empty } from "@/components/lms/ui";
import { getInsights, listLearners, listSeats, listPeople } from "@/lib/lms/admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

/**
 * Is anything broken, and is anyone waiting?
 *
 * An operations screen opens with numbers, not with the operator's own name.
 * Until this existed, an admin signing in landed on the learner dashboard and was
 * invited to "Start module 1" — the product telling its owner it had no idea who
 * they were. Not one query in lms/queries.ts aggregated across learners, so
 * "how many people signed up this week" meant writing SQL, which meant nobody
 * looked.
 *
 * Every tile links into the list it counts. A number you cannot click is a number
 * you have to go and find.
 */
export default async function AdminOverview() {
  const [people, seats, learners, insights] = await Promise.all([
    listPeople(),
    listSeats(),
    listLearners(),
    getInsights(),
  ]);

  const awaitingReview = learners.reduce((n, l) => n + l.artifacts.submitted, 0);
  const unboundSeats = seats.filter((s) => !s.user_id).length;
  const instructors = people.filter((p) => p.roles.includes("instructor")).length;
  const unassignedInstructors = people.filter(
    (p) => p.roles.includes("instructor") && p.courses.length === 0,
  ).length;
  const sheetsAwaiting = insights.reduce((n, i) => n + (i.submittedSheets - i.scoredSheets), 0);

  const tiles = [
    { label: "People", value: people.length, href: "/admin/people", note: `${instructors} instructors` },
    {
      label: "Artifacts awaiting review",
      value: awaitingReview,
      href: "/admin/learners",
      note: unassignedInstructors ? `${unassignedInstructors} instructor with no course` : "all assigned",
    },
    {
      label: "Sheets awaiting a score",
      value: sheetsAwaiting,
      href: "/admin/seats",
      note: unboundSeats ? `${unboundSeats} of 6 seats unbound` : "all seats bound",
    },
    {
      label: "Enrolments",
      value: learners.length,
      href: "/admin/learners",
      note: `${learners.filter((l) => l.completion).length} completed`,
    },
  ];

  return (
    <>
      <h1 className="t-h2 text-ink">Overview</h1>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => (
          <li key={t.label}>
            <Link
              href={t.href}
              className="flex h-full flex-col rounded-[var(--radius-card)] border border-line bg-surface p-4 no-underline transition-colors hover:border-line-strong"
            >
              <span className="t-stat leading-none tabular-nums text-ink">{t.value}</span>
              <span className="t-body-sm mt-2 text-ink">{t.label}</span>
              <span className="t-meta mt-0.5 text-ink-muted">{t.note}</span>
            </Link>
          </li>
        ))}
      </ul>

      {/* ------------------------------------------------------------ drop-off */}
      <section aria-labelledby="dropoff" className="mt-10">
        <h2 id="dropoff" className="t-h3 text-ink">
          Where people stop
        </h2>
        <p className="t-body-sm mt-1 max-w-[62ch] text-ink-secondary">
          Learners with at least one completed lesson in each module. Read across a row and the
          shape of the drop is the most useful thing this console can show you.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr className="border-b border-line-strong">
                <th scope="col" className="t-label py-2 text-left text-ink-muted">
                  Course
                </th>
                {Array.from({ length: 8 }, (_, i) => (
                  <th key={i} scope="col" className="t-label py-2 text-right text-ink-muted">
                    {String(i + 1).padStart(2, "0")}
                  </th>
                ))}
                <th scope="col" className="t-label py-2 text-right text-ink-muted">
                  Sheets
                </th>
              </tr>
            </thead>
            <tbody>
              {insights.map((row) => (
                <tr key={row.course.id} className="border-b border-line">
                  <th scope="row" className="t-body-sm py-2.5 pr-4 text-left font-normal text-ink">
                    {row.course.title}
                    <span className="t-meta block text-ink-muted">{row.enrolled} enrolled</span>
                  </th>
                  {Array.from({ length: 8 }, (_, i) => {
                    const n = row.reachedModule[i] ?? 0;
                    return (
                      <td
                        key={i}
                        className={`t-body-sm py-2.5 text-right tabular-nums ${
                          n === 0 ? "text-ink-muted" : "text-ink"
                        }`}
                      >
                        {n}
                      </td>
                    );
                  })}
                  <td className="t-body-sm py-2.5 text-right tabular-nums text-ink">
                    {row.scoredSheets}/{row.submittedSheets}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {learners.length === 0 ? (
        <div className="mt-8">
          <Empty title="No enrolments yet">
            Nothing has been started. The numbers above will fill in on their own.
          </Empty>
        </div>
      ) : null}
    </>
  );
}
