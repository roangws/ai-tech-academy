export const OPEN_COURSE_SLUG = "hybrid-filmmaking";
export const OPEN_COURSE_START = "September 12";

export function courseDetailHref(slug: string): string {
  return `/courses/${slug}`;
}

export function courseStartHref(slug: string): string {
  return `/courses/${slug}/start`;
}

export function courseApplicationHref(slug = OPEN_COURSE_SLUG): string {
  return `/sign-up?next=${encodeURIComponent(courseStartHref(slug))}`;
}

export function courseWaitlistHref(slug: string): string {
  return `/sign-up?next=${encodeURIComponent(`/courses/${slug}`)}`;
}
