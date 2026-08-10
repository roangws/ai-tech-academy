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
 * ONE SHEET, and it was two. `.doc-sheet` in globals.css owns the geometry and
 * carries the arithmetic: on screen the document is A4 landscape by ratio and
 * fluid, on paper it is sized in absolute millimetres to fill exactly the box
 * `@page` leaves. The ratio was being used for both, and 277mm of printable
 * width at the paper's own ratio is 5.8mm taller than the printable height — so
 * the footer row landed on a second sheet and Roan got a page whose only content
 * was the issue date and the verify URL, under an "ISSUED" label left behind on
 * page one.
 *
 * `print:` utilities strip the shadow and the rounded corners, which are screen
 * affordances that print as grey mush.
 *
 * `print-color-adjust: exact` is load-bearing. Browsers strip background colours
 * when printing by default as an ink-saving courtesy, which would take the crest
 * and the accent rule with it and leave a page of black text.
 *
 * ------------------------------------------------------------------ the layout
 *
 * Three horizontal bands, bracketed by two hairlines, and the brackets are the
 * fix for the other half of Roan's report.
 *
 * The first version distributed three children down the sheet with
 * `justify-between`. On a box this tall holding this little that is not a layout,
 * it is two voids with type at the ends of them: the name floated a third of the
 * way down with 60mm of nothing above it and 60mm below. Nothing was wrong with
 * any single element and the page still read as unfinished.
 *
 * The assertion is now framed rather than floated. It sits between two rules
 * that run the full measure, so the air around it is visibly the document's
 * margin rather than a gap something fell out of, and the two ends of the sheet
 * carry the two things a stranger reads first and last: who issued this, and how
 * to check it.
 *
 * The footer is three columns, not two. Issued, reference, and the page the
 * reference resolves on — which was previously a 10px line tucked under the
 * reference and is the single most useful string on the document to anybody who
 * did not earn it.
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
          Three bands in a column, the middle one taking the slack.

          Not `justify-between`, which is what this was and what left the name
          floating in the middle of two voids — see the layout note above. The
          assertion is `flex-1` and centres its own content, so the free space on
          a short record is distributed inside a framed band rather than opened up
          as two gaps between three unrelated blocks.
        */
        className="doc-sheet relative flex flex-col p-8 md:p-12 print:p-[12mm]"
      >
        {/* The course's own hue as a hairline across the head of the document.
            One colour, drawn from the same token the course card uses, so a
            printed record is recognisably of that course. */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1.5"
          style={{ background: course.ground ?? "var(--accent)" }}
        />

        <div className="flex flex-none items-start justify-between gap-6">
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

        {/*
          The assertion, framed.

          `border-y` is the pair of rules that turns the surrounding air into a
          margin instead of a void, and `justify-center` is what keeps the block
          optically on the sheet's own centre line whatever length the name and
          the course title run to.
        */}
        <div className="mt-7 flex flex-1 flex-col justify-center border-y border-line py-8 print:mt-[8mm] print:py-[8mm]">
          <div className="flex items-start gap-5 print:gap-[6mm]">
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
              {/*
                Bigger in print than on screen, and the two are not the same
                measurement problem.

                On screen the name shares a column with the page's own chrome and
                42px is already the largest thing on it. On a 297mm sheet, 42px is
                11mm of cap height on a document whose entire subject is the person
                named — it printed as a heading rather than as the record's
                subject. 54px is 14mm, which is the size this reads at on paper.
              */}
              <p className="mt-1.5 font-display text-[34px] font-bold leading-tight tracking-[-0.02em] text-ink md:text-[42px] print:text-[54px]">
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
                A course completes when your workflow runs live and you have measured it. Every
                lesson, lab and template in the course was finished.
              </p>
            </div>
          </div>
        </div>

        {/*
          Three facts on the baseline, in a grid rather than a flex row.

          It was two columns pushed apart with `justify-between`, with the verify
          URL as a 10px line hanging under the reference. That URL is the most
          useful string on the sheet to the one reader the sheet exists for — a
          stranger holding it who wants to know whether it is real — and it was
          set smaller than everything else on the page and attached to the number
          rather than given a label of its own.

          A fixed three-column grid also means the row cannot wrap, which is what
          made the two-page break land between a label and its value.
        */}
        {/*
          NO TOP BORDER ON THIS ROW. The band above draws a bottom rule as half of
          its `border-y`, so a `border-t` here put two hairlines 40px apart with
          nothing between them — the same doubled-rule seam the course page's
          closing panel has a note about, and it printed as a visible ladder across
          the foot of the document.

          `[auto_auto_minmax(0,1fr)]`, not `grid-cols-3`. The three cells hold a
          date, a 20-character reference and a 48-character URL, and at equal widths
          the URL was the only one that did not fit — it wrapped onto two lines while
          two thirds of the row sat empty. Sized to content, content, then whatever
          is left, all three land on one line and the row still reaches both edges.
        */}
        <div className="mt-7 grid flex-none grid-cols-[auto_auto_minmax(0,1fr)] gap-x-8 gap-y-4 print:mt-[8mm]">
          <div>
            <p className="t-label text-ink-muted">Issued</p>
            <p className="t-body-sm mt-0.5 text-ink">{issued}</p>
          </div>
          <div>
            <p className="t-label text-ink-muted">Reference</p>
            {/* Selectable text rather than an image, so it can be copied out of
                a PDF and pasted into an email. `tabular-nums` keeps it even. */}
            <p className="t-body-sm mt-0.5 tabular-nums text-ink">{reference}</p>
          </div>
          {verifyUrl ? (
            <div className="text-right">
              {/* "Verify at", not "Anyone can check it at". The longer version was
                  a sentence in a slot sized for a label, and it wrapped before the
                  URL under it did. */}
              <p className="t-label text-ink-muted">Verify at</p>
              {/* `break-all` and not `truncate`: a URL that has been cut short is
                  worse than one that wraps, because it looks complete. */}
              <p className="t-body-sm mt-0.5 break-all text-ink">{verifyUrl}</p>
            </div>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
