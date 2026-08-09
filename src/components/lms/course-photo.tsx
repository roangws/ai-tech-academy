import Image from "next/image";
import type { Course } from "@/lib/content";

/**
 * A course's own photograph, cropped to its subject.
 *
 * ----------------------------------------------------------------- why it exists
 *
 * The dashboard identified each course with a small rounded tile holding a thin
 * line-art glyph. Five cards, five nearly-identical tiles, each a generic symbol
 * standing in for a subject the site already has a real photograph of. It read
 * as filler, because it was: the marketing pages have been carrying these five
 * frames since the covers landed, and the signed-in product ignored them.
 *
 * So the LMS uses the same five pictures the catalogue does. A learner arriving
 * from `/courses` now recognises the course they clicked.
 *
 * ---------------------------------------------------------------- the crop
 *
 * `objectPosition` comes from `cover.focus`, which is authored per course
 * because these frames are 16:9 or taller and every surface here crops them
 * hard. At the default `50% 50%` the GTM frame resolves to a strip of desk with
 * the person a long way above it. content.ts explains the per-image reasoning;
 * this just has to not throw it away, which is exactly what the marketing hero
 * did on its first pass.
 *
 * ---------------------------------------------------------- not CourseCover
 *
 * `CourseCover` in components/ui is the marketing treatment: a letter watermark
 * at 13%, a "You build" line, an artifact reservation, and a ratio that is a
 * floor rather than a height. All of it exists to sell a course to somebody who
 * has not started it. A learner who is six lessons in needs the picture and
 * nothing else, so this is the picture and nothing else.
 */
export function CoursePhoto({
  course,
  className = "",
  sizes = "(min-width: 1024px) 420px, 100vw",
  priority = false,
}: {
  course: Course;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const cover = course.cover;

  /* A course with no photograph degrades to its own ground colour rather than to
     a gap or a placeholder. Generated placeholder art is banned outright here,
     and an empty slot beats a monogram tile. */
  if (!cover) {
    return (
      <div
        aria-hidden="true"
        style={{ background: course.ground ?? "var(--surface-sunken)" }}
        className={`absolute inset-0 ${className}`}
      />
    );
  }

  return (
    <Image
      src={cover.src}
      alt={cover.alt}
      width={cover.width}
      height={cover.height}
      sizes={sizes}
      priority={priority}
      style={{ objectPosition: cover.focus ?? "50% 50%" }}
      /*
        `absolute inset-0`, not `size-full`.

        With `size-full` the image stays in normal flow, so its own intrinsic
        height decides the box and the wrapper's `aspect-[…]` is ignored — a
        1127x1400 portrait rendered nearly square inside a wrapper asking for
        16:7. Taking it out of flow makes the wrapper the only thing setting the
        height, which is what the ratio was for.
      */
      className={`absolute inset-0 size-full object-cover ${className}`}
    />
  );
}
