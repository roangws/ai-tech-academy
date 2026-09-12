import Link from "next/link";
import { getCatalog } from "@/lib/catalog";
import { CoursePhoto } from "@/components/lms/course-photo";
import {
  IntakeButton,
  IntakeDescription,
} from "@/components/course/intake-provider";

export async function IntakeCards({ exclude = [] }: { exclude?: string[] }) {
  const courses = (await getCatalog()).filter((c) => !exclude.includes(c.slug));
  return (
    <section aria-labelledby="intake-courses-title" className="mt-10">
      <h2 id="intake-courses-title" className="t-h3 text-ink">
        Your next courses
      </h2>
      <p className="t-body-sm mt-2 text-ink-secondary">
        Apply for filmmaking or save your place on an upcoming course.
      </p>
      <ul className="mt-5 grid gap-4 sm:grid-cols-2">
        {courses.map((course) => (
          <li
            key={course.id}
            className="flex flex-col rounded-[var(--radius-card)] border border-line bg-surface p-5"
          >
            <div className="flex items-center gap-4">
              <Link
                href={`/courses/${course.slug}`}
                className="relative size-16 flex-none overflow-hidden rounded-lg"
                tabIndex={-1}
                aria-hidden="true"
              >
                <CoursePhoto course={course} sizes="64px" />
              </Link>
              <div>
                <Link
                  href={`/courses/${course.slug}`}
                  className="t-body-sm font-medium text-ink hover:underline"
                >
                  {course.title}
                </Link>
                <IntakeDescription slug={course.slug} />
              </div>
            </div>
            <IntakeButton slug={course.slug} className="mt-5 w-full" withDate />
          </li>
        ))}
      </ul>
    </section>
  );
}
