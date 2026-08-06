import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";

/*
  One family across the whole page. Inter is the typeface the project's own
  LMS design system specifies, and every reference that reads as a product
  (Coursera, Udemy, DeepLearning.AI) uses a single neutral sans at 400/500/600.
*/
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

/*
  Inter Tight 700 is the wordmark face specified by the brand package
  (public/brand/README.txt). It is scoped to the logo lockup alone. Headings
  stay on Inter, which is what references/DESIGN-SPEC.md asks for.
*/
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

const siteUrl = "https://aitecheducation.academy";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Free applied AI course: deploy one workflow and measure it",
    template: "%s | AI Tech Education Academy",
  },
  /*
    Kept under 155 characters so the whole line survives in a result, with
    "free applied AI course" front-loaded and the access model at the end.
  */
  description:
    "A free, project-based applied AI course. Five role-based paths. Build an AI workflow on your own data, deploy it, and measure the result. Module 1 is open.",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "AI Tech Education Academy",
    title: "Deploy one AI workflow and measure what it changed",
    description:
      "Five role-based paths for operators and technical teams. Module 1 is open to everyone, and every path completes with a live deployment.",
    images: [
      {
        url: "/images/scenes/lesson-recording.jpg",
        width: 1600,
        height: 900,
        alt: "Roan Weigert recording a lesson at the studio microphone",
      },
    ],
  },
  /* summary_large_image needs an image declared, or the card renders blank. */
  twitter: { card: "summary_large_image", images: ["/images/scenes/lesson-recording.jpg"] },
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${interTight.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
