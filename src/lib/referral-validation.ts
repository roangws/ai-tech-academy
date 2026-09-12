/** Preflight only. Postgres rechecks the code when granting course access. */
export function isValidCourseReferral(value: unknown): boolean {
  return typeof value === "string" && value.length <= 80 && value.trim().toUpperCase() === "MASTERCLASS";
}
