import { Container } from "@/components/ui";
import { FloatingLessons } from "@/components/lms/floating-lessons";
import { getViewer } from "@/lib/auth";

export async function LessonPreview() {
  const viewer = await getViewer();
  return <div className="border-t border-line bg-surface pb-12 pt-5 md:pb-16" id="explore-classes"><Container><FloatingLessons preview requireLogin={!viewer} /></Container></div>;
}
