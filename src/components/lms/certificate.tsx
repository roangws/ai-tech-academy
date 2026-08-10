import { Avatar } from "@/components/lms/avatar";
import { CertificateSeal } from "@/components/lms/certificate-seal";
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
 *   - No signature, drawn or scanned, and this is the one place the redesign
 *     departs from Roan's references. Two of the three he sent have a signature
 *     over a rule — "Colman Walsh, Founder and CEO" on the UX Design Institute
 *     one, an empty SIGNATURE field on the Cuvida one. A signature is a person
 *     attesting, and nobody attests to these individually: they are issued by a
 *     rule, `claim_completion`, the moment every lesson is done. A drawn
 *     signature would be the one forged thing on a document about verification.
 *     The slot it would occupy is not left empty either — an empty signature line
 *     is a promise to sign later. It is filled by "Issued by", which says the true
 *     thing: the academy issued this, automatically, on completion.
 *   - No grade, score or distinction. Nothing in the system produces one.
 *   - No seal reading "accredited", "certified" or "verified". This program is not
 *     accredited by anybody and the FAQ says so in as many words. There IS a seal
 *     now — see certificate-seal.tsx for what it is allowed to carry.
 *   - No hours. `workload_hours` is an estimate of the course, not a measure of
 *     what this person spent, and printing it on a personal document converts an
 *     estimate into a claim about them. Skillshare's reference prints "CLASS
 *     LENGTH · 30 minutes" in exactly this slot; ours cannot.
 *
 * What it does carry is exactly what is true and checkable: who, which course,
 * what the course required, when it was issued, and a reference that resolves in
 * our own records. The canonical sentence from `content.ts` — "A course completes
 * when your workflow runs live and you have measured it" — is printed because it
 * is what completion here MEANS, and a reader outside the program has no way to
 * know that otherwise.
 *
 * ------------------------------------------------------------------ the layout
 *
 * REBUILT against three references Roan sent: UX Design Institute, Skillshare, and
 * a Cuvida membership card. What they have in common, and what this now has:
 *
 *   1. A FULL-BLEED COLOURED HEADER BAND carrying the issuer's lockup. All three
 *      have one. The previous version had a 6px hairline of the course hue across
 *      the top and was otherwise a white page — which is why it read as a web page
 *      that had been printed rather than as a document. The band is a gradient from
 *      the course's own hue into the brand accent, so a printed record is
 *      recognisably of that course without needing a second colour system.
 *   2. A SEAL overlapping the band's lower edge. certificate-seal.tsx.
 *   3. FIELDS ON RULES, which is the device that makes all three references read as
 *      instruments rather than as posters, and it is used two different ways here
 *      because the two zones are doing different jobs:
 *        - The name and the course are VALUE, then rule, then caption — the UX
 *          Design Institute arrangement. The value is the point and the caption
 *          only says what kind of thing it is.
 *        - The footer facts are LABEL, then rule, then value — Skillshare's. In a
 *          row of three, the labels have to align on one baseline or the row reads
 *          as three unrelated blocks.
 *   4. NOT a watermark, which reference 1 has and which was tried twice and cut.
 *      The note in the body says why, and what it would have to be to come back.
 *
 * Deliberately NOT copied: Skillshare's organic ribbon bleeding off two corners and
 * Cuvida's abstract gradient blob. Both are brand illustration, this brand has
 * none, and inventing a decorative shape for one document would put a visual
 * language on the most formal object on the site that appears nowhere else on it.
 *
 * -------------------------------------------------------------------- printing
 *
 * ONE SHEET, and it was two. `.doc-sheet` in globals.css owns the geometry and
 * carries the arithmetic: on screen the document is A4 landscape by ratio and
 * fluid, on paper it is sized in absolute millimetres to fit the box `@page`
 * leaves. The ratio was being used for both, and 277mm of printable width at
 * 297/210 is taller than the printable height — so the footer row landed on a
 * second sheet and Roan got a page whose only content was the issue date and the
 * verify URL, under an "ISSUED" label left behind on page one.
 *
 * `print-color-adjust: exact` is load-bearing, and more so now than before.
 * Browsers strip background colours when printing as an ink-saving courtesy, which
 * would take the entire header band with it and leave a page of black text under a
 * white rectangle where the lockup used to be legible.
 *
 * The print block in globals.css also pins this document's tokens to their light
 * values. The signed-in app has a dark theme, and without that pin a reader who
 * had it on printed a black certificate.
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
   *
   * None of the three references has a portrait, and it stays because it is a real
   * thing a real holder chose to add. It sits in the BODY, above the name it belongs
   * to. It spent one pass in the header band, on the argument that a photograph on a
   * document is identification and belongs with the issuer's block — and the seal
   * overlaps that same corner, so the two landed on top of each other: two circles
   * of similar size touching, which is the one arrangement that made both look like
   * mistakes.
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

  const hue = course.ground ?? "var(--accent)";

  return (
    <div
      /* `mx-auto` and a max width, so on a wide screen it reads as a document on
         a desk rather than as a band stretched across the viewport. */
      className="mx-auto w-full max-w-[900px] overflow-hidden rounded-[var(--radius-feature)] border border-line bg-surface shadow-e2 print:max-w-none print:rounded-none print:border-0 print:shadow-none"
      style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
    >
      {/* `overflow-hidden` here as well as on the wrapper, because the watermark
          ring is deliberately larger than the sheet and is clipped by it. Without
          it the ring escapes the rounded corners on screen. */}
      <div className="doc-sheet relative flex flex-col overflow-hidden">
        {/* --------------------------------------------------------- the band */}
        {/*
          The gradient runs from the course's own hue into the brand accent, at
          100deg so the seam falls under the seal rather than across the wordmark.

          Height is a percentage of the sheet rather than a fixed rem value, because
          the sheet is 189mm tall in print and roughly 500px tall on screen: a band
          fixed at 120px is a quarter of the document on paper and a seventh of it on
          screen, and it has to be the same object in both.
        */}
        <div
          className="relative flex-none px-8 pb-7 pt-8 md:px-12 md:pb-8 md:pt-10 print:px-[14mm] print:pb-[9mm] print:pt-[11mm]"
          style={{
            background: `linear-gradient(100deg, ${hue} 0%, ${hue} 26%, var(--accent) 100%)`,
          }}
        >
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-3.5">
              {/* `ring="transparent"` is not an option on `Crest`, and it does not
                  need to be: the crest's inner rule is drawn in white, which is
                  exactly right on a saturated band and is what it is drawn in on
                  the dark site header too. */}
              <Crest size={44} />
              <div>
                <p className="font-display text-[19px] font-bold leading-tight tracking-[-0.02em] text-white">
                  {brand.name}
                </p>
                <p className="t-meta text-white/70">{brand.tagline}</p>
              </div>
            </div>

            {/* The band's right-hand block.

                THE PORTRAIT IS NOT IN HERE, and it was for one pass. It sat left of
                this text and the seal — which overlaps this corner — landed on top
                of it, two round objects of similar size touching. The portrait moved
                into the body beside the name, which is where it belongs anyway: it
                identifies the person the document is about, not the issuer.

                `pr` clears the seal below, which still overlaps this corner and would
                otherwise crowd the reference. */}
            <div className="pr-[76px] text-right print:pr-[22mm]">
              <p className="t-label text-white/85">Completion record</p>
              {/* The reference, in the band as well as in the footer, and this is
                  the one repetition on the document that is deliberate. Both
                  references that print an id put it at the top — Skillshare's
                  "CERTIFICATE ID" is the first thing on the sheet — because it is
                  what somebody reads out when they are checking one, and hunting for
                  it in a footer is the moment a document feels like a form. */}
              <p className="t-meta mt-0.5 tabular-nums text-white/65">{reference}</p>
            </div>
          </div>

          {/* The seal, overlapping the band's lower edge by half its height. The
              band is the containing block, so the offset is measured from its own
              bottom rather than from the sheet's. */}
          <div className="absolute bottom-0 right-8 translate-y-1/2 md:right-12 print:right-[14mm]">
            <CertificateSeal courseBadge={course.badge} hue={hue} size={120} />
          </div>
        </div>

        {/*
          THERE IS NO WATERMARK, and there were two attempts at one.

          Reference 1 has a huge ghosted ring behind the whole sheet and it works
          there for a reason worth writing down: it is big enough that only a broad,
          almost-straight sweep of it crosses the page, so it reads as a texture. Both
          attempts here were mid-sized rings bled off the right edge, and at that
          scale the curvature is unmistakable — it read as a stray circle drawn across
          the body, and the second one cut straight through the line naming the
          course.

          Scaling it up to reference size is the fix on paper and not in practice: at
          85% of the sheet the ring passes behind the name and the footer, and this is
          a document that gets printed on domestic inkjets, where 4% of a dark teal is
          somewhere between invisible and a grey smear depending on the printer. The
          gradient band and the seal already do the work a watermark would do.

          If it comes back it has to be the crest rather than a bare ring — a shape
          with meaning reads as a watermark even when it is faint, and a circle reads
          as a circle.
        */}

        {/* --------------------------------------------------------- the body */}
        <div className="relative flex flex-1 flex-col justify-center px-8 py-8 md:px-12 md:py-9 print:px-[14mm] print:py-[10mm]">
          {/* The portrait, when there is one, on the same baseline as the line that
              introduces the name. `mb` rather than a flex row: at 44mm the name is
              two lines on a long one, and a row would centre a 56px circle against a
              90px block and leave it floating between the two lines. */}
          {photoUrl ? (
            <Avatar
              name={name}
              url={photoUrl}
              size={52}
              className="mb-3.5 flex-none border border-line"
            />
          ) : null}
          <p className="t-body-sm text-ink-secondary">This records that</p>

          {/* The name: value, rule, caption. The rule runs to a measure rather than
              to the full width, so a short name does not sit at the head of a
              300mm line. */}
          <p className="mt-1 max-w-[22ch] font-display text-[34px] font-bold leading-[1.08] tracking-[-0.025em] text-ink md:text-[44px] print:text-[46px]">
            {name}
          </p>
          <div className="mt-2.5 max-w-[560px] border-t border-line" />
          <p className="t-meta mt-1.5 text-ink-muted">The name on this account</p>

          <p className="t-body-sm mt-6 text-ink-secondary print:mt-[7mm]">has completed</p>
          <p className="font-display mt-1 text-[21px] font-bold leading-snug tracking-[-0.015em] text-ink md:text-[25px] print:text-[26px]">
            {course.title}
          </p>
          <div className="mt-2.5 max-w-[560px] border-t border-line" />
          <p className="t-meta mt-1.5 text-ink-muted">
            {course.badge}
            {/* What completion MEANS, as the course field's own caption rather than
                as a paragraph of its own. It was a two-line paragraph floating under
                the assertion with nothing attaching it to anything; as a caption it
                is visibly a note about the course named directly above it, which is
                what it is. */}
            <span className="text-ink-muted">
              {" · "}A course completes when the workflow runs live and has been measured. Every
              lesson, lab and template in this course was finished.
            </span>
          </p>
        </div>

        {/* ------------------------------------------------------- the footer */}
        {/*
          Label, rule, value — Skillshare's arrangement, and the rules are what make
          three facts read as one row.

          `[auto_auto_minmax(0,1fr)]`, not three equal columns: the cells hold a
          date, a 20-character reference and a 48-character URL, and at equal widths
          the URL was the only one that did not fit — it wrapped onto two lines while
          two thirds of the row sat empty.

          `items-end` and `flex-none`, so the row sits on the sheet's baseline
          whatever the body above it does.
        */}
        <div className="flex-none px-8 pb-8 md:px-12 md:pb-10 print:px-[14mm] print:pb-[11mm]">
          <div className="grid grid-cols-[auto_auto_minmax(0,1fr)] gap-x-6 gap-y-5 sm:grid-cols-[auto_auto_auto_minmax(0,1fr)]">
            <Field label="Issued">{issued}</Field>
            <Field label="Reference">
              {/* Selectable text rather than an image, so it can be copied out of a
                  PDF and pasted into an email. `tabular-nums` keeps it even. */}
              <span className="tabular-nums">{reference}</span>
            </Field>
            {/* The slot a signature would occupy on two of the three references,
                filled with the true version of what a signature asserts. The
                docblock has the argument. */}
            <Field label="Issued by" className="hidden sm:block">
              {brand.name}
            </Field>
            {verifyUrl ? (
              <Field label="Verify at" align="right">
                {/* "Verify at", not "Anyone can check it at". The longer label was a
                    sentence in a slot sized for a label, and its `whitespace-nowrap`
                    was setting this column's minimum width from the LABEL rather than
                    from the URL under it — so the URL broke across two lines while a
                    third of the row sat empty. `break-all` and not `truncate`, because
                    a URL that has been cut short is worse than one that wraps: it
                    looks complete. */}
                <span className="break-all">{verifyUrl}</span>
              </Field>
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * One footer fact: a label, a rule, a value.
 *
 * A component rather than four copies, because the whole point of the arrangement
 * is that the three labels share a baseline and the three rules share a line — and
 * four hand-written copies of `t-label`, `border-t` and `mt` drift the first time
 * one of them is edited.
 */
function Field({
  label,
  align = "left",
  className = "",
  children,
}: {
  label: string;
  align?: "left" | "right";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`${align === "right" ? "text-right" : ""} ${className}`}>
      <p className="t-label whitespace-nowrap text-ink-muted">{label}</p>
      <div className="mt-1.5 border-t border-line-strong" />
      <p className="t-body-sm mt-1.5 text-ink">{children}</p>
    </div>
  );
}
