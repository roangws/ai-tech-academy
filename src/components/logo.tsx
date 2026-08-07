import Link from "next/link";
import { brand } from "@/lib/content";

/*
  Brand crest and lockup, drawn to the geometry in the supplied logo package
  (public/brand/ai-tech-education-lockup.svg and README.txt).

  Grid 120 x 136. Shield x 8-112, top y 6, bottom arc r 52, top corner r 26.
  The white rule is a true 9-unit concentric inset at stroke 5. The A has its
  apex at (55,40) with feet at (33,92) and (77,92); the I spans x 69-87 at 50%
  white so the overlap makes a third value. Cap line y 40 and baseline y 92 are
  shared by both letters.

  Package rules honoured here:
    - Below 24px the full monogram is replaced by the 16px cut, which is the
      solid A alone. See CrestMini.
    - The rule colour always matches the ground it sits on, so the light-rule
      crest stays off dark grounds.
    - Clear space equals the top corner radius, 26 of 120 units, so roughly 22%
      of the mark width. The lockup gap below satisfies it at every size used.
    - Wordmark is Inter Tight 700 at -0.02em tracking. That face is loaded for
      the lockup alone; headings stay on Inter, per references/DESIGN-SPEC.md.
*/

const CREST_CYAN = "#02B1E0";
const A_TINT = "#CFEDF9";
const DARK_GROUND = "#082B3A";

/** Full monogram. Valid at 24px and above. */
export function Crest({ size = 32, ring = "#FFFFFF" }: { size?: number; ring?: string }) {
  return (
    <svg
      width={size}
      height={(size * 136) / 120}
      viewBox="0 0 120 136"
      fill="none"
      aria-hidden="true"
      className="block flex-none"
    >
      <path
        d="M34 6H86A26 26 0 0 1 112 32V78A52 52 0 0 1 8 78V32A26 26 0 0 1 34 6Z"
        fill={CREST_CYAN}
      />
      <path
        d="M34 15H86A17 17 0 0 1 103 32V78A43 43 0 0 1 17 78V32A17 17 0 0 1 34 15Z"
        fill="none"
        stroke={ring}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path d="M55 40 77 92H33Z" fill={A_TINT} />
      <path d="M69 40H87V92H69Z" fill="#FFFFFF" fillOpacity="0.5" />
    </svg>
  );
}

/** The 16px cut: solid A, no rule, no I. Required below 24px. */
export function CrestMini({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={(size * 136) / 120}
      viewBox="0 0 120 136"
      fill="none"
      aria-hidden="true"
      className="block flex-none"
    >
      <path
        d="M34 6H86A26 26 0 0 1 112 32V78A52 52 0 0 1 8 78V32A26 26 0 0 1 34 6Z"
        fill={CREST_CYAN}
      />
      <path d="M60 36 84 94H36Z" fill="#FFFFFF" />
    </svg>
  );
}

/**
 * Horizontal lockup. `descriptor` adds the second line from the package, which
 * the footer uses and the 72px header omits so the chrome keeps its height.
 */
export function Logo({
  size = 32,
  descriptor = false,
  tone = "light",
  compact = false,
}: {
  size?: number;
  descriptor?: boolean;
  tone?: "light" | "dark";
  /**
   * Below sm, swap the full name for `brand.short` and drop the descriptor.
   *
   * This used to drop the wordmark entirely, on the grounds that the package
   * allows the mark alone at 24px and above and the 390px chrome has a CTA and
   * a menu button to fit. It does, and the result was a phone header whose
   * top-left corner was an unlabelled cyan shield: the one screen where a
   * visitor is least likely to recognise a mark they have never seen was the
   * one screen that never told them whose site they were on.
   *
   * "AI Tech" measures about 62px at 18px, which the row has. It is a
   * truncation of the real name rather than a second brand, so the two can
   * never disagree. content.ts has the note.
   */
  compact?: boolean;
}) {
  const onDark = tone === "dark";

  return (
    <Link
      href="/"
      className="group flex flex-none items-center gap-2.5 no-underline"
      aria-label={`${brand.name}, home`}
    >
      {size >= 24 ? (
        <Crest size={size} ring={onDark ? DARK_GROUND : "#FFFFFF"} />
      ) : (
        <CrestMini size={size} />
      )}
      <span className="flex min-w-0 flex-col">
        <span
          className={`font-display text-[18px] font-bold leading-[23px] tracking-[-0.02em] ${
            onDark ? "text-white" : "text-ink"
          }`}
        >
          {/*
            Two spans rather than a JS breakpoint check. The header renders on
            the server and hydrates, so a width read in the client would ship
            the wrong name in the HTML and swap it after paint, which is a
            visible flicker on the brand.
          */}
          {compact ? (
            <>
              <span className="sm:hidden">{brand.short}</span>
              <span className="hidden sm:inline">{brand.name}</span>
            </>
          ) : (
            brand.name
          )}
        </span>
        {descriptor ? (
          <span
            className={`t-meta font-normal ${compact ? "hidden sm:block" : ""} ${
              onDark ? "text-[#A9C6D1]" : "text-ink-muted"
            }`}
          >
            {brand.tagline}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
