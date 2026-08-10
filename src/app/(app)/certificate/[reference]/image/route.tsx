import { renderCertificate } from "@/lib/lms/certificate-image";
import { verifyCompletion } from "@/lib/lms/certificates";

/**
 * The certificate as a PNG.
 *
 * One route, two dispositions. `?download=1` is what the download control on the
 * certificate page points at; without it the same bytes are an inline image that
 * every page showing a certificate embeds. That is what keeps the drawing in
 * src/lib/lms/certificate-image.tsx the only drawing of the document.
 *
 * The reference is the capability. It resolves through `verify_completion`, the
 * SECURITY DEFINER function the public verification page also uses, so this
 * renders for a signed-out reader and still exposes nothing the printed document
 * does not carry. A reference that does not resolve is a 404 rather than a blank
 * certificate with somebody else's frame around it.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ reference: string }> },
) {
  const { reference } = await params;
  const record = await verifyCompletion(reference);
  if (!record) return new Response("No certificate with that reference", { status: 404 });

  const image = await renderCertificate(record);

  /* The record is immutable once issued, so a long shared cache is safe. The
     portrait is the one thing that can change under it, which is worth an hour
     of staleness rather than a fresh render per view. */
  const headers = new Headers(image.headers);
  headers.set("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
  if (new URL(request.url).searchParams.has("download")) {
    headers.set("Content-Disposition", `attachment; filename="${record.reference}.png"`);
  }

  return new Response(image.body, { status: image.status, headers });
}
