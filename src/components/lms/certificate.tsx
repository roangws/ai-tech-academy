import { Avatar } from "@/components/lms/avatar";
import { Crest } from "@/components/logo";
import { brand } from "@/lib/content";
import type { Course } from "@/lib/catalog";

/**
 * The completion record, as a printable document.
 *
 * ------------------------------------------------------------ what it may claim
 *
 * This is the most claim-dense object on the site: a named person, a named
 * course, a date, and an implicit assertion that the first did the second. The
 * imagery and copy policy at the head of `content.ts` applies with full force
 * here, and it rules out most of what a certificate template usually contains.
 *
 * Absent, and each for a reason rather than for taste:
 *
 *   - No signature, drawn or scanned. A signature is a person attesting, and
 *     nobody attests to these individually — they are issued by a rule
 *     (`claim_completion`, when every lesson is done). A decorative signature
 *     would be the one forged thing on a document about verification.
 *   - No grade, score or distinction. Nothing in the system produces one.
 *   - No seal reading "accredited". This program is not accredited by anybody and
 *     the FAQ says so in as many words.
 *   - No hours. `workload_hours` is an estimate of the course, not a measure of
 *     what this person spent, and printing it on a personal document converts an
 *     estimate into a claim about them.
 *
 * What it does carry is exactly what is true and checkable: who, which course,
 * what the course required, when it was issued, and a reference that resolves in
 * our own records. The canonical sentence from `content.ts` — "A course completes
 * when your workflow runs live and you have measured it" — is printed because it
 * is what completion here MEANS, and a reader outside the program has no way to
 * know that otherwise.
 *
 * -------------------------------------------------------------------- printing
 *
 * A4 landscape at 297×210mm, sized in millimetres rather than pixels so it comes
 * out at paper scale rather than at whatever a 96dpi assumption produces. On
 * screen it scales down inside its container; `print:` utilities strip the
 * shadow and the rounded corners, which are screen affordances that print as
 * grey mush.
 *
 * `print-color-adjust: exact` is load-bearing. Browsers strip background colours
 * when printing by default as an ink-saving courtesy, which would take the crest
 * and the accent rule with it and leave a page of black text.
 */
export function Certificate({
  name,
  course,
  reference,
  issuedAt,
  photoUrl = null,
  verifyUrl = null,
}: {
  name: string;
  course: Course;
  reference: string;
  issuedAt: string;
  /**
   * The holder's portrait, when they have added one.
   *
   * Optional, and the layout is designed for both states rather than patched for
   * one: with no photograph the assertion simply starts at the left margin. A
   * placeholder silhouette was the alternative and it is worse — it prints a
   * generic face onto a document about a specific person.
   */
  photoUrl?: string | null;
  /**
   * Where a stranger checks this. Printed on the document, because a reference
   * nobody can resolve is decoration: the number only becomes evidence once the
   * page that answers for it is on the same piece of paper.
   */
  verifyUrl?: string | null;
}) {
  const issued = new Date(issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      /* `mx-auto` and a max width, so on a wide screen it reads as a document on
         a desk rather than as a band stretched across the viewport. */
      className="mx-auto w-full max-w-[900px] overflow-hidden rounded-[var(--radius-feature)] border border-line bg-surface shadow-e2 print:max-w-none print:rounded-none print:border-0 print:shadow-none"
      style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
    >
      <div
        /*
          `justify-between`, and it was two stacked `mt-auto` before.
          
          Two auto margins in one flex column SPLIT the free space between them,
          so on a 297×210 box whose content is much shorter the certificate came
          out with the header at the top, the name a third of the way down and a
          visible void between the assertion and the footer rule. Distributing
          three children across the height is what the shape wants: mark at the
          top, the assertion in the middle where the eye lands, the two facts on
          the baseline.
        */
        className="relative flex flex-col justify-between p-8 md:p-12"
        /* The ratio is the paper, so what is on screen is what comes out. */
        style={{ aspectRatio: "297 / 210" }}
      >
        {/* The course's own hue as a hairline across the head of the document.
            One colour, drawn from the same token the course card uses, so a
            printed record is recognisably of that course. */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1.5"
          style={{ background: course.ground ?? "var(--accent)" }}
        />

        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-3">
            <Crest size={40} />
            <div>
              <p className="font-display text-[17px] font-bold leading-tight tracking-[-0.02em] text-ink">
                {brand.name}
              </p>
              <p className="t-meta text-ink-muted">{brand.tagline}</p>
            </div>
          </div>
          <p className="t-label text-right text-ink-muted">Completion record</p>
        </div>

        {/* The assertion, and it is deliberately one sentence with the two
            proper nouns in it. */}
        <div className="flex items-start gap-5 py-6">
          {photoUrl ? (
            <Avatar
              name={name}
              url={photoUrl}
              size={72}
              className="mt-1 flex-none border border-line"
            />
          ) : null}
          <div className="min-w-0">
          <p className="t-body-sm text-ink-secondary">This records that</p>
          <p className="mt-1.5 font-display text-[34px] font-bold leading-tight tracking-[-0.02em] text-ink md:text-[42px]">
            {name}
          </p>
          <p className="t-body mt-3 max-w-[52ch] text-ink-secondary">
            completed <span className="font-medium text-ink">{course.title}</span>
            {course.badge ? <span className="text-ink-muted"> · {course.badge}</span> : null}.
          </p>

          {/* What completion means here, in the program's own canonical words.
              Without it a reader outside the program has no way to know this is
              not an attendance certificate. */}
          <p className="t-body-sm mt-4 max-w-[62ch] text-ink-secondary">
            A course completes when your workflow runs live and you have measured it. Every lesson,
            lab and template in the course was finished.
          </p>
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6 border-t border-line pt-5">
          <div>
            <p className="t-label text-ink-muted">Issued</p>
            <p className="t-body-sm text-ink">{issued}</p>
          </div>
          <div className="text-right">
            <p className="t-label text-ink-muted">Reference</p>
            {/* Selectable text rather than an image, so it can be copied out of
                a PDF and pasted into an email. `tabular-nums` keeps it even. */}
            <p className="t-body-sm tabular-nums text-ink">{reference}</p>
            {verifyUrl ? <p className="t-meta mt-0.5 text-ink-muted">{verifyUrl}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
