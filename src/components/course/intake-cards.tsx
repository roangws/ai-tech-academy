import Link from "next/link";
import { getCatalog } from "@/lib/catalog";
import { getIntakeSnapshot } from "@/lib/course-intake";
import { CoursePhoto } from "@/components/lms/course-photo";
import {
  IntakeButton,
  IntakeDescription,
} from "@/components/course/intake-provider";

export async function IntakeCards({ exclude = [] }: { exclude?: string[] }) {
  const courses = (await getCatalog()).filter((c) => !exclude.includes(c.slug));
  const snapshot = await getIntakeSnapshot();
  const approved = new Set(snapshot.courses.filter((course) => course.status === "approved").map((course) => course.slug));
  const groups = [
    { id: "accessible-courses", title: "My courses", description: "Your courses are unlocked. Open a course to go straight to your lessons.", courses: courses.filter((course) => approved.has(course.slug)) },
    { id: "intake-courses", title: "Applications and upcoming courses", description: "Apply for filmmaking or save your place on an upcoming course.", courses: courses.filter((course) => !approved.has(course.slug)) },
  ];
  return <>{groups.filter((group) => group.courses.length).map((group) => (
    <section key={group.id} aria-labelledby={`${group.id}-title`} className="mt-10">
      <h2 id={`${group.id}-title`} className="t-h3 text-ink">
        {group.title}
      </h2>
      <p className="t-body-sm mt-2 text-ink-secondary">
        {group.description}
      </p>
      <ul className="mt-5 grid gap-4 sm:grid-cols-2">
        {group.courses.map((course) => (
          <li
            key={course.id}
            className="flex flex-col rounded-[var(--radius-card)] border border-line bg-surface p-5"
          >
            <div className="flex items-center gap-4">
              <Link
                href={`/courses/${course.slug}${approved.has(course.slug) ? "/start" : ""}`}
                className="relative size-16 flex-none overflow-hidden rounded-lg"
                tabIndex={-1}
                aria-hidden="true"
              >
                <CoursePhoto course={course} sizes="64px" />
              </Link>
              <div>
                <Link
                  href={`/courses/${course.slug}${approved.has(course.slug) ? "/start" : ""}`}
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
  ))}</>;
}
