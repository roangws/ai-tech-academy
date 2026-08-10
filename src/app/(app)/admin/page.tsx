import type { Metadata } from "next";
import Link from "next/link";
import { Empty } from "@/components/lms/ui";
import {
  getInsights,
  getMonths,
  listApplications,
  listLearners,
  listSeats,
  listPeople,
} from "@/lib/lms/admin";
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
  const [people, seats, learners, insights, months, applications] = await Promise.all([
    listPeople(),
    listSeats(),
    listLearners(),
    getInsights(),
    getMonths(),
    listApplications(),
  ]);

  /* The current month's signups, and the tile below says "this month". It was
     `weeks.at(-1)` against a weekly series; the series is monthly now and a label
     saying "week" over a month's count is the kind of quiet wrongness an operations
     screen must not have. */
  const newThisMonth = months.at(-1)?.signups ?? 0;

  /* The course with the most people in it is the one whose drop-off is worth
     drawing. With nothing enrolled anywhere it falls back to the first, so the
     chart renders empty rather than throwing. */
  const busiest = [...insights].sort((a, b) => b.enrolled - a.enrolled)[0] ?? insights[0];

  const unboundSeats = seats.filter((s) => !s.user_id).length;
  const unassignedInstructors = people.filter(
    (p) => p.roles.includes("instructor") && p.courses.length === 0,
  ).length;
  /* Who a judging event would actually reach. `issue_judge_event` fans out to
     every holder of the role, so this is the number that decides whether issuing
     one does anything at all. */
  const judges = people.filter((p) => p.roles.includes("judge")).length;

  const tiles = [
    {
      label: "People",
      value: people.length,
      href: "/admin/people",
      note: `${newThisMonth} new this month`,
    },
    /*
      TWO TILES CAME OUT, 9 Aug. Roan, quoting them back: "1 / Artifacts awaiting
      review / all assigned / 0 / Sheets awaiting a score / 5 of 6 seats unbound — i
      dont want that info."

      They were queue depths presented as headline statistics, and a queue of one is
      not a statistic. Worse, both spent their sub-line on a fact that only matters
      when it is a problem: "all assigned" and "all seats bound" are four tiles' worth
      of pixels saying nothing is wrong. When something IS wrong the "Needs a decision"
      list below says so in a sentence, which is the screen that should own it, and
      both numbers are one click away on the pages they linked to.

      "5 of 6 seats unbound" also hardcoded the seat count, which is a row count.
      Nothing left on this screen types a total by hand.
    */
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
    diagnosis. These are the states that stop the product working at all, and
    each one is invisible from a number: an instructor with no course opens an
    empty console, an unbound seat means submitted sheets sit unread forever, and
    nobody holding the judge role means a judging event reaches no one.

    THE TWO ARTIFACT LINES CAME OUT, 9 Aug. "Work submitted to them is unread"
    and "N artifacts submitted with no instructor to read them" both described a
    queue that can no longer be joined: the module hand-in was removed that day,
    and the instructor review console with it. An operations screen naming a
    problem nobody can cause is worse than one line shorter.
  */
  const blocking: string[] = [];
  if (unassignedInstructors > 0) {
    blocking.push(
      `${unassignedInstructors} instructor${unassignedInstructors === 1 ? " has" : "s have"} no course, so nothing opens on their console`,
    );
  }
  if (judges === 0) {
    blocking.push("Nobody holds the judge role, so a judging event would notify nobody");
  }
  /* Derived from the table rather than compared against a literal 6, which is what
     this said and which would have gone quietly wrong the first time a seventh seat
     was added or a sixth removed. Phrased forwards, per the copy rule: it names what
     has to happen rather than what is absent. */
  if (seats.length > 0 && unboundSeats === seats.length) {
    blocking.push("Every judge seat still needs a person bound to it before a sheet can be scored");
  }
  /* An application waiting is the one item on this list that costs a person
     rather than the platform: somebody put their evidence and their phone number
     in and is being asked to wait. It goes last because it blocks nothing that is
     already running, and it goes on the list because nothing else on this screen
     would ever mention it. */
  const applicationsWaiting = applications.filter(
    (a) => a.status === "submitted" || a.status === "in_review",
  ).length;
  if (applicationsWaiting > 0) {
    blocking.push(
      `${applicationsWaiting} application${applicationsWaiting === 1 ? " is" : "s are"} waiting on the advisory board`,
    );
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
          bars={months.map((m) => ({ label: m.label, value: m.signups, sub: m.active }))}
          unit=" signups"
        />
        {/* The busiest course, named. A funnel with no course on it is a funnel
            the reader has to ask about, and with five courses the answer is not
            guessable. */}
        <Funnel
          caption={`Where people stop · ${busiest.course.title}`}
          steps={busiest.reachedModule.map((n, k) => ({
            label: String(k + 1).padStart(2, "0"),
            value: n,
          }))}
        />
      </div>

      {/*
        ONE LINE, from four. Roan: "too mych text."

        It ran to four sentences, and three of them explained the schema: that there is
        no session table, no page views, and that `lessons.minutes` is an editorial
        estimate so a "time spent" figure would be meaningless. All true, all reasons
        this chart shows what it shows rather than something better, and none of it is
        something the reader of an operations screen needs at the moment they are
        reading two bars. The argument belongs where the data is assembled, so it moved
        into the docblock on `getMonths`.

        What survives is the only sentence that helps somebody read the chart, which is
        which bar is which.
      */}
      <p className="t-meta mt-2 max-w-[70ch] text-ink-muted">
        The solid bar is accounts created. The pale one behind it is people who finished at
        least one lesson that month.
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
