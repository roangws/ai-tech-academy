import type { Metadata } from "next";
import Link from "next/link";
import { Empty } from "@/components/lms/ui";
import { getInsights, getWeeks, listLearners, listSeats, listPeople } from "@/lib/lms/admin";
import { BarChart, Funnel } from "@/components/lms/chart";

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
  const [people, seats, learners, insights, weeks] = await Promise.all([
    listPeople(),
    listSeats(),
    listLearners(),
    getInsights(),
    getWeeks(),
  ]);

  const newThisWeek = weeks.at(-1)?.signups ?? 0;

  const awaitingReview = learners.reduce((n, l) => n + l.artifacts.submitted, 0);
  const unboundSeats = seats.filter((s) => !s.user_id).length;
  const instructors = people.filter((p) => p.roles.includes("instructor")).length;
  const unassignedInstructors = people.filter(
    (p) => p.roles.includes("instructor") && p.courses.length === 0,
  ).length;
  const sheetsAwaiting = insights.reduce((n, i) => n + (i.submittedSheets - i.scoredSheets), 0);

  const tiles = [
    {
      label: "People",
      value: people.length,
      href: "/admin/people",
      note: newThisWeek ? `${newThisWeek} new this week` : "none new this week",
    },
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

  /*
    What is actually wrong right now, in the order it costs the platform.

    An operations screen that only shows counts makes the reader do the
    diagnosis. These are the three states that stop the product working at all,
    and each one is invisible from a number: a course with nobody teaching it
    silently swallows every artifact submitted to it, an unbound seat means
    submitted sheets sit unread forever, and a course with nothing authored is
    five modules of generated outline with a learner in them.
  */
  const blocking: string[] = [];
  if (unassignedInstructors > 0) {
    blocking.push(
      `${unassignedInstructors} instructor${unassignedInstructors === 1 ? " has" : "s have"} no course, so work submitted to them is unread`,
    );
  }
  if (awaitingReview > 0 && instructors === 0) {
    blocking.push(`${awaitingReview} artifact${awaitingReview === 1 ? "" : "s"} submitted with no instructor to read them`);
  }
  if (unboundSeats === 6) {
    blocking.push("no judge seat is bound, so no outcome sheet can be scored");
  }

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

      {/* ------------------------------------------------------- needs a human */}
      {blocking.length ? (
        <section aria-labelledby="blocking" className="mt-8">
          <h2 id="blocking" className="t-h3 text-ink">
            Needs a decision
          </h2>
          <p className="t-body-sm mt-1.5 max-w-[62ch] text-ink-secondary">
            Each of these stops part of the product working until somebody acts.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {blocking.map((line) => (
              <li
                key={line}
                className="t-body-sm rounded-[var(--radius-card)] border border-line border-l-[3px] border-l-danger bg-surface px-4 py-3 text-ink-secondary"
              >
                {line}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ------------------------------------------------------------- charts */}
      <div className="mt-8 grid gap-4 xl:grid-cols-2">
        <BarChart
          caption="Who arrived, and who came back"
          bars={weeks.map((w) => ({ label: w.label, value: w.signups, sub: w.active }))}
          unit=" signups"
        />
        <Funnel
          caption="Where people stop"
          steps={(insights.find((i) => i.enrolled > 0) ?? insights[0]).reachedModule.map((n, k) => ({
            label: `Module ${String(k + 1).padStart(2, "0")}`,
            value: n,
          }))}
        />
      </div>

      <p className="t-meta mt-2 max-w-[70ch] text-ink-muted">
        The solid bar is accounts created; the pale one behind it is people who completed at least
        one lesson that week. There is no session table and no page views, so those two are the
        only honest activity signals the schema has — and `lessons.minutes` is an editorial
        estimate, so any &ldquo;time spent&rdquo; figure would be a number with nothing behind it.
      </p>

      {/* ---------------------------------------------------------- per course */}
      <section aria-labelledby="per-course" className="mt-10">
        <h2 id="per-course" className="t-h3 text-ink">
          Each course
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr className="border-b border-line-strong">
                <th scope="col" className="t-label py-2 text-left text-ink-muted">Course</th>
                <th scope="col" className="t-label py-2 text-right text-ink-muted">Enrolled</th>
                <th scope="col" className="t-label py-2 text-right text-ink-muted">Reached 08</th>
                <th scope="col" className="t-label py-2 text-right text-ink-muted">Sheets scored</th>
                <th scope="col" className="t-label py-2 text-right text-ink-muted">Completed</th>
              </tr>
            </thead>
            <tbody>
              {insights.map((row) => (
                <tr key={row.course.id} className="border-b border-line">
                  <th scope="row" className="t-body-sm py-2.5 pr-4 text-left font-normal text-ink">
                    {row.course.title}
                  </th>
                  <td className="t-body-sm py-2.5 text-right tabular-nums text-ink">{row.enrolled}</td>
                  <td className="t-body-sm py-2.5 text-right tabular-nums text-ink-secondary">
                    {row.reachedModule.at(-1) ?? 0}
                  </td>
                  <td className="t-body-sm py-2.5 text-right tabular-nums text-ink-secondary">
                    {row.scoredSheets}/{row.submittedSheets}
                  </td>
                  <td className="t-body-sm py-2.5 text-right tabular-nums text-ink">{row.completions}</td>
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
