export const OPEN_COURSE_SLUG = "hybrid-filmmaking";
export const OPEN_COURSE_START = "September 12";
export const WAITLIST_START = "October";

export type IntakeStatus = "waitlisted" | "applied" | "approved";
export type IntakeCourse = {
  slug: string;
  title: string;
  status: IntakeStatus | null;
  application?: {
    company: string;
    job_title: string;
    projects: string;
    goals: string;
  };
};
export type IntakeSnapshot = {
  signedIn: boolean;
  userId?: string;
  profile?: { company: string; jobTitle: string };
  courses: IntakeCourse[];
};

export function courseIntakeHref(slug: string): string {
  return `/courses/${slug}?intake=1`;
}

export function courseDetailHref(slug: string): string {
  return `/courses/${slug}`;
}

export function courseStartHref(slug: string): string {
  return `/courses/${slug}/start`;
}

export function courseApplicationHref(slug = OPEN_COURSE_SLUG): string {
  return courseIntakeHref(slug);
}

export function courseWaitlistHref(slug: string): string {
  return courseIntakeHref(slug);
}
