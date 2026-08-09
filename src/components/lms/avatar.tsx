/**
 * A reader's portrait, or their initials.
 *
 * ---------------------------------------------------------------- no <Image>
 *
 * A plain `<img>`, deliberately. `next/image` optimises images it can reason
 * about at build time; an avatar is a per-user URL on a Supabase Storage domain
 * that changes whenever someone uploads a new one, so it would need a
 * `remotePatterns` entry for the storage host and would then proxy every
 * portrait through the image optimiser for a 36px circle. The upload path
 * already bounds these at 2MB by bucket policy.
 *
 * -------------------------------------------------------------- the fallback
 *
 * Initials on the course-hue ground, not a grey silhouette. Most accounts will
 * never upload a photo, so the fallback is the common case and should look
 * deliberate rather than like a missing asset.
 *
 * `aria-hidden` throughout: every place this renders, the control around it
 * already has an accessible name ("Your account"). An avatar that announces the
 * reader's own name to the reader is noise.
 */
export function Avatar({
  name,
  email,
  url,
  size = 36,
  className = "",
}: {
  name?: string | null;
  email?: string | null;
  url?: string | null;
  size?: number;
  className?: string;
}) {
  /* First letter of the name, then of the email local part, then a dash — never
     an empty circle, which reads as a broken image. */
  const initial =
    name?.trim()?.[0]?.toUpperCase() ?? email?.trim()?.[0]?.toUpperCase() ?? "—";

  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={`relative inline-grid flex-none place-items-center overflow-hidden rounded-full border border-line bg-surface-subtle ${className}`}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" width={size} height={size} className="size-full object-cover" />
      ) : (
        <span
          className="font-semibold text-ink-secondary"
          style={{ fontSize: Math.max(11, Math.round(size * 0.4)) }}
        >
          {initial}
        </span>
      )}
    </span>
  );
}
