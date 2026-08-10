"use client";

import { PrinterIcon } from "@phosphor-icons/react/dist/ssr";

/**
 * "Download" is a print dialogue, and saying so is the honest label.
 *
 * The control reads "Download PDF" because that is the outcome a reader wants
 * and the one every platform's print dialogue offers as "Save as PDF". Calling
 * it "Print" would be accurate about the mechanism and wrong about the intent —
 * most people taking a copy of a certificate are not putting it on paper.
 *
 * A client component for one line, because `window.print()` cannot exist in a
 * server component and there is nothing else on the page that needs the browser.
 * The alternative — a `<form>` posting somewhere to generate a PDF server-side —
 * is a headless Chromium in a serverless function to reproduce something the
 * reader's own browser already does better. See the note in
 * `dashboard/certifications/[courseId]/page.tsx`.
 */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="t-button inline-flex h-10 items-center gap-2 rounded-[var(--radius-control)] bg-accent px-4 text-on-accent transition-colors hover:bg-accent-hover"
    >
      <PrinterIcon size={15} weight="bold" aria-hidden="true" />
      Download PDF
    </button>
  );
}
