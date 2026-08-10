import sharp from "sharp";

import { CERTIFICATE_SIZE, renderCertificate } from "@/lib/lms/certificate-image";
import { verifyCompletion } from "@/lib/lms/certificates";
import { singleImagePdf } from "@/lib/pdf";

/**
 * The certificate as a PDF.
 *
 * Same drawing as the PNG route, and deliberately the same drawing rather than a
 * document laid out again in a PDF library: what somebody prints has to be what
 * they were looking at when they pressed the button.
 *
 * PNG to JPEG to PDF, and the middle step is the point. A PDF can embed JPEG
 * bytes verbatim under /DCTDecode with no re-encoding at either end, which is
 * what lets src/lib/pdf.ts be sixty lines instead of a dependency. Quality 92 at
 * 2000px wide is a file around 400KB with no visible artefact on the hairlines,
 * which are the first thing to go when this is set too low.
 *
 * `chromaSubsampling: 4:4:4` for the same reason. The default 4:2:0 halves the
 * colour resolution, and the two places that shows are thin coloured rules and
 * small coloured text — which on this document is the seal and the course badge.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reference: string }> },
) {
  const { reference } = await params;
  const record = await verifyCompletion(reference);
  if (!record) return new Response("No certificate with that reference", { status: 404 });

  const png = Buffer.from(await (await renderCertificate(record)).arrayBuffer());
  const jpeg = await sharp(png)
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
    .toBuffer();

  const pdf = singleImagePdf({
    jpeg,
    width: CERTIFICATE_SIZE.width,
    height: CERTIFICATE_SIZE.height,
    title: `${record.holder ?? "Certificate"} — ${record.course_title}`,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${record.reference}.pdf"`,
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
