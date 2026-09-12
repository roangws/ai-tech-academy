import { notFound } from "next/navigation";
import { bySlug } from "@/lib/lms/queries";
import { requireCourseAccess } from "@/lib/course-intake";

export default async function CourseAccessLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await bySlug(slug);
  if (!course) notFound();
  await requireCourseAccess(slug, course.id);
  return children;
}
