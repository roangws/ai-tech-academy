import { readFile } from "node:fs/promises";
import path from "node:path";
import { bySlug } from "@/lib/lms/queries";
import { requireCourseAccess } from "@/lib/course-intake";

const kits = new Set(["tutorial", "vlog", "promo", "micro-drama", "launch"]);
export async function GET(request: Request, { params }: { params: Promise<{ kit: string }> }) {
  const { kit } = await params;
  if (!kits.has(kit)) return new Response("Kit not found", { status: 404 });
  const course = await bySlug("hybrid-filmmaking");
  if (!course) return new Response("Course not found", { status: 404 });
  await requireCourseAccess(course.slug, course.id);
  const skillOnly = new URL(request.url).searchParams.get("file") === "skill";
  const extension = skillOnly ? "md" : "zip";
  const data = await readFile(path.join(process.cwd(), "resources/video-kits", `${kit}.${extension}`));
  return new Response(data, { headers: {
    "Content-Type": skillOnly ? "text/markdown; charset=utf-8" : "application/zip",
    "Content-Disposition": `attachment; filename="${kit}${skillOnly ? '-SKILL' : '-kit'}.${extension}"`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  } });
}
