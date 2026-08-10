/**
 * One JPEG, one page, one PDF.
 *
 * ------------------------------------------------------------ why by hand
 *
 * The certificate is already drawn, once, by the image route. What a PDF adds is
 * a page box around it: something that opens at A4 in a viewer and prints at A4
 * on paper. Every PDF library in reach would do that by adding between 200KB and
 * two megabytes of dependency, a second layout engine, and in the React-PDF case
 * a second description of the certificate that has to be kept looking like the
 * first one.
 *
 * A PDF that contains exactly one image is about sixty lines, and this file is
 * the whole of it. The repo already makes this argument twice about image tools:
 * scripts/optimize-images.mjs uses `sips` rather than adding a dependency, and
 * scripts/prepare-logos.mjs justifies `sharp` on the grounds that Next ships it
 * anyway.
 *
 * ----------------------------------------------------------------- the format
 *
 * Five objects, in the order a reader of the spec would expect them:
 *
 *   1  Catalog   the document root
 *   2  Pages     the page tree, with one page in it
 *   3  Page      the page box, and what is drawn on it
 *   4  Contents  the drawing: scale the unit square to the page, paint the image
 *   5  XObject   the JPEG, uncompressed by us and undecoded by us
 *
 * The JPEG goes in verbatim under /DCTDecode, which is the filter name for JPEG
 * compression. That is the trick that makes this short: the bytes a JPEG encoder
 * produced are already in the form a PDF wants, so there is no encoding step
 * here at all, and no pixel ever passes through this file.
 *
 * The xref table is byte offsets into the finished file, which is why the
 * objects are accumulated as buffers with a running length rather than
 * concatenated into a string at the end.
 */

/** A4 in PostScript points, landscape. 72pt to the inch. */
const A4_LANDSCAPE = { width: 841.89, height: 595.28 } as const;

/** Escape the three characters that end a PDF string early. */
function pdfString(value: string): string {
  return value.replace(/([\\()])/g, "\\$1");
}

export type PdfOptions = {
  /** The JPEG to place on the page, edge to edge. */
  jpeg: Buffer;
  /** Pixel dimensions of that JPEG. Recorded in the image dictionary. */
  width: number;
  height: number;
  /** Document title, as viewers show it in the window chrome. */
  title: string;
};

/**
 * Wrap a JPEG in a single-page A4 landscape PDF.
 *
 * The image is drawn to the full MediaBox. The caller is expected to hand over
 * something with the A4 ratio — the certificate renderer draws 2000x1414, which
 * is √2 to within a pixel — because a mismatch here stretches rather than
 * letterboxes, and silently stretching somebody's name is worse than the caller
 * having one thing to get right.
 */
export function singleImagePdf({ jpeg, width, height, title }: PdfOptions): Buffer {
  const { width: pw, height: ph } = A4_LANDSCAPE;

  /* `cm` sets the transformation matrix, and an image XObject is always drawn
     into the unit square, so scaling by the page size is what places it. q and Q
     save and restore the graphics state around it, which costs nothing and is
     what every generator emits. */
  const contents = `q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q\n`;

  const objects: Buffer[] = [
    Buffer.from("<< /Type /Catalog /Pages 2 0 R >>"),
    Buffer.from("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
    Buffer.from(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] ` +
        `/Resources << /XObject << /Im0 5 0 R >> /ProcSet [/PDF /ImageC] >> /Contents 4 0 R >>`,
    ),
    Buffer.concat([
      Buffer.from(`<< /Length ${contents.length} >>\nstream\n`),
      Buffer.from(contents, "latin1"),
      Buffer.from("endstream"),
    ]),
    Buffer.concat([
      Buffer.from(
        `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} ` +
          `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode ` +
          `/Length ${jpeg.byteLength} >>\nstream\n`,
      ),
      jpeg,
      Buffer.from("\nendstream"),
    ]),
    Buffer.from(
      `<< /Title (${pdfString(title)}) /Producer (AI Tech Education Academy) >>`,
    ),
  ];

  /* %PDF-1.4 and then four bytes above 127, which is the comment every PDF opens
     with to tell a transport that this file is binary and must not be newline
     translated. */
  const parts: Buffer[] = [Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "latin1")];
  let offset = parts[0].byteLength;
  const offsets: number[] = [];

  objects.forEach((body, i) => {
    const object = Buffer.concat([
      Buffer.from(`${i + 1} 0 obj\n`),
      body,
      Buffer.from("\nendobj\n"),
    ]);
    offsets.push(offset);
    offset += object.byteLength;
    parts.push(object);
  });

  const startxref = offset;
  const xref =
    `xref\n0 ${objects.length + 1}\n` +
    "0000000000 65535 f \n" +
    offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("") +
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 6 0 R >>\n` +
    `startxref\n${startxref}\n%%EOF\n`;

  parts.push(Buffer.from(xref, "latin1"));
  return Buffer.concat(parts);
}

export const PDF_PAGE = A4_LANDSCAPE;
