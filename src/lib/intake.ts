export const OPEN_COURSE_SLUG = "hybrid-filmmaking";

export function courseStartHref(slug: string): string {
  return `/courses/${slug}/start`;
}

export function courseApplicationHref(slug = OPEN_COURSE_SLUG): string {
  return `/sign-up?next=${encodeURIComponent(courseStartHref(slug))}`;
}

export function courseWaitlistHref(slug: string): string {
  return `/sign-up?next=${encodeURIComponent(`/courses/${slug}`)}`;
}
