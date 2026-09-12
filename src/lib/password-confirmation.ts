export function passwordConfirmationError(password: string, confirmation: unknown): string | null {
  if (typeof confirmation !== "string" || !confirmation) return "Enter your password again.";
  return password === confirmation ? null : "Passwords do not match.";
}
