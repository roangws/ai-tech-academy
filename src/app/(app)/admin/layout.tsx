import Link from "next/link";
import {
  ChartLineUpIcon,
  EnvelopeSimpleIcon,
  GavelIcon,
  GraduationCapIcon,
  IdentificationCardIcon,
  SealCheckIcon,
  StackIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Container } from "@/components/ui";
import { requireRole } from "@/lib/auth";

/**
 * The back office.
 *
 * ------------------------------------------------------------ guarded twice
 *
 * `requireRole` here covers every page beneath, which is safe in a way the
 * `(app)` layout's deliberate absence of a guard is not: nothing under /admin is
 * public, so there is no free-first-module rule to preserve.
 *
 * It does NOT cover Server Actions. A layout does not run for an action invoked
 * from a page under it, and an action is a POST endpoint reachable by anyone who
 * can read the page's HTML — so every function in src/app/actions/admin.ts calls
 * `requireRole("admin")` itself. And underneath both, `is_admin()` in the
 * policies is what actually decides; these two are a good error message.
 *
 * -------------------------------------------------------------------- the rail
 *
 * The one place the product's no-sidebar rule should break. A learning surface is
 * something you read down; a back office is a set of destinations you move
 * between all day, and five of them behind a top-bar dropdown would be worse for
 * the person who lives here.
 */

const SECTIONS = [
  { href: "/admin", label: "Overview", Icon: ChartLineUpIcon },
  { href: "/admin/people", label: "People", Icon: UsersThreeIcon },
  /* Above Judging, because it is the step before one: somebody is accepted here
     and then bound to a seat there. */
  { href: "/admin/applications", label: "Applications", Icon: EnvelopeSimpleIcon },
  /* The two public rosters. Directly above Judging, because half of what that
     page reconciles is edited here — a judge's card and a judge's seat are two
     of the three facts, and putting them apart in the rail is what let the
     third one go unnoticed. */
  { href: "/admin/roster", label: "Instructors and judges", Icon: IdentificationCardIcon },
  /* Was "Judge seats", and was one page showing one of the three things being a
     judge consists of. See the note at the head of admin/judging/page.tsx. */
  { href: "/admin/judging", label: "Judging", Icon: GavelIcon },
  { href: "/admin/learners", label: "Learners", Icon: GraduationCapIcon },
  /* Directly under Learners, because it is the same people seen through the one
     question the learners table cannot answer: who holds a completion record
     and who has earned one without taking it. */
  { href: "/admin/certifications", label: "Certifications", Icon: SealCheckIcon },
  { href: "/admin/courses", label: "Courses", Icon: StackIcon },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("admin", "/admin");

  return (
    <Container className="py-8 md:py-10">
      <div className="grid items-start gap-8 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Admin sections" className="lg:sticky lg:top-[88px]">
          <p className="t-label px-2.5 text-ink-muted">Administration</p>
          <ul className="mt-2 flex flex-wrap gap-1 lg:flex-col">
            {SECTIONS.map(({ href, label, Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="t-body-sm flex min-h-[44px] items-center gap-2.5 rounded-[var(--radius-control)] px-2.5 text-ink-secondary no-underline transition-colors hover:bg-surface-subtle hover:text-ink"
                >
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="t-meta mt-4 px-2.5 text-ink-muted">
            You are an administrator. Everything here reads across every account.
          </p>
        </nav>

        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
