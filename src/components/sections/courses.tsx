import { ArrowRightIcon, CheckIcon, SealCheckIcon } from "@phosphor-icons/react/dist/ssr";
import { CourseIntakeButton, CourseCover, Section, SectionHeader, FactsLine, TextAction } from "@/components/ui";
import { getCatalog, moduleCount, type Course } from "@/lib/catalog";
import { OPEN_COURSE_SLUG } from "@/lib/intake";

export async function Courses() {
  const catalog = await getCatalog();
  if (!catalog.length) return null;
  const featured = catalog.find((c) => c.slug === OPEN_COURSE_SLUG) ?? catalog[0];
  return <Section id="courses" tint>
    <SectionHeader label="Courses" heading="Our courses" intro="Learn AI for filmmaking, business, and your everyday work." />
    <ul className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
      <li className="flex sm:col-span-2"><CourseCard course={featured} featured homepage /></li>
      {catalog.filter((c) => c.id !== featured.id).map((course) => <li key={course.id} className="flex"><CourseCard course={course} homepage /></li>)}
    </ul>
  </Section>;
}

export function CourseCard({ course, eager = false, featured = false, homepage = false }: { course: Course; eager?: boolean; featured?: boolean; homepage?: boolean }) {
  return <article className={`group flex h-full w-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-e1 ${featured ? "md:flex-row" : ""}`}>
    <div className={featured ? "md:w-[44%] md:flex-none" : ""}>
      <CourseCover ground={course.ground} image={course.cover} eager={eager} href={`/courses/${course.slug}`} title={course.title} fill={featured} showInitial={false} />
    </div>
    <div className={`flex min-w-0 flex-1 flex-col ${featured ? "p-5" : "p-4"}`}>
      <p className="t-body-sm text-ink-secondary">{course.summary}</p>
      <div className={featured ? "mt-4" : "mt-3 mb-4"}><FactsLine items={[moduleCount(course), course.duration]} /></div>
      {featured && <p className="t-meta mt-3 text-ink-secondary"><span className="font-medium text-ink">For </span>{course.audience}</p>}
      {featured && <div className="my-4 border-t border-line pt-4">
        <p className="t-field text-ink-muted">{featured ? "Inside the course" : "What you’ll learn"}</p>
        <ul className="mt-2 space-y-2">
          {(featured ? course.curriculum.slice(0, 5).map((m) => m.name) : course.whatLearn.slice(0, 2)).map((item) => <li key={item} className="t-body-sm flex items-start gap-2 text-ink-secondary"><CheckIcon aria-hidden="true" size={15} className="mt-1 shrink-0 text-accent" /><span>{item}</span></li>)}
        </ul>
        {featured && <p className="t-meta mt-2 text-ink-muted">Explore all {course.curriculum.length} modules on the course page.</p>}
      </div>}
      {featured && homepage && <div data-course-project className="flex flex-1 flex-col justify-center rounded-lg bg-surface-subtle p-4">
        <p className="t-field text-ink">Your final project</p>
        <p className="t-body-sm mt-1 text-ink-secondary">{course.slug === OPEN_COURSE_SLUG ? "Finish a hybrid film and document your production workflow." : course.summary}</p>
        <p className="t-meta mt-3 flex items-center gap-2 text-ink"><SealCheckIcon size={18} className="shrink-0 text-accent" aria-hidden="true" />Earn your certification when you finish the course.</p>
      </div>}
      <div data-course-actions className={`${featured && homepage ? "mt-4" : "mt-auto"} flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-line pt-4`}>
        <CourseIntakeButton slug={course.slug} withDate size="md" className="whitespace-nowrap" />
        <TextAction href={`/courses/${course.slug}`}>View course <ArrowRightIcon size={14} weight="bold" /></TextAction>
      </div>
    </div>
  </article>;
}
