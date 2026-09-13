import { readFile } from "node:fs/promises";
import path from "node:path";
import { bySlug } from "@/lib/lms/queries";
import { requireCourseAccess } from "@/lib/course-intake";
import { filmmakingVisuals } from "@/lib/filmmaking-visuals";

export async function GET(request: Request, { params }: { params: Promise<{ lesson: string }> }) {
  const { lesson } = await params;
  if (!Object.hasOwn(filmmakingVisuals, lesson)) return new Response("Lesson not found", { status: 404 });
  const image = new URL(request.url).searchParams.get("image");
  if (image !== null && !["0", "1", ...(lesson === "2" ? ["shot-0", "shot-1", "shot-2", "shot-3"] : [])].includes(image)) return new Response("Image not found", { status: 404 });
  const course = await bySlug("hybrid-filmmaking");
  if (!course) return new Response("Course not found", { status: 404 });
  await requireCourseAccess(course.slug, course.id);
  const file = image === null ? `${lesson}.zip` : `${lesson}/${image}.webp`;
  const data = await readFile(path.join(process.cwd(), "resources/lesson-materials", file));
  return new Response(data, { headers: {
    "Content-Type": image === null ? "application/zip" : "image/webp",
    "Content-Disposition": image === null ? `attachment; filename="lesson-${lesson}-visual-notes.zip"` : "inline",
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  } });
}
