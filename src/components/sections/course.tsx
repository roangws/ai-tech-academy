import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { VideoPlayer } from "@/components/video-player";
import { ButtonLink, Section, SectionHeader, StatusChip } from "@/components/ui";
import { course, cta } from "@/lib/content";

/**
 * The course preview plays here.
 *
 * It leads with the real footage and puts the module outline directly beside
 * it, so the access model reads at a glance: one open module, four behind a
 * free account.
 *
 * Changed on 6 Aug. The poster carries a title card, because the frame alone
 * showed a man pointing off-screen in red light and gave a reader nothing to go
 * on. The includes strip dropped from five columns to three, since at 1216px
 * five columns broke every item onto two ragged lines. And the button reads
 * "Watch module 1" rather than repeating the header's label a third time.
 */
export function Course() {
  return (
    <Section id="course">
      <SectionHeader
        label={course.label}
        heading={course.headline}
        intro={course.intro}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-8">
        <figure className="m-0 min-w-0">
          <VideoPlayer
            src={course.video.src}
            poster={course.video.poster}
            posterAlt={course.video.posterAlt}
            card={course.video.card}
          />
          <figcaption className="t-meta mt-2 text-ink-muted">
            {course.video.caption}
          </figcaption>
        </figure>

        <div className="min-w-0">
          <p className="t-meta font-semibold text-ink-secondary">{course.outlineLabel}</p>
          <ol className="mt-3 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
            {course.outline.map((m) => (
              <li
                key={m.n}
                className="flex min-h-[52px] items-start gap-3 border-b border-line px-4 py-2.5 last:border-b-0 sm:h-[56px] sm:items-center sm:py-0"
              >
                <span className="t-meta flex h-7 w-7 flex-none items-center justify-center rounded-full border border-line text-ink">
                  {m.n}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1 sm:gap-0">
                  <span className="t-card-title clamp-2 text-ink sm:truncate">{m.name}</span>
                  <span className="t-meta flex flex-wrap items-center gap-x-2 text-ink-muted">
                    {m.detail}
                    <span className="sm:hidden">
                      <StatusChip open={m.access === "Open"}>{m.access}</StatusChip>
                    </span>
                  </span>
                </span>
                <span className="hidden flex-none sm:block">
                  <StatusChip open={m.access === "Open"}>{m.access}</StatusChip>
                </span>
              </li>
            ))}
          </ol>
          <p className="t-body-sm mt-3 text-ink-secondary">{course.outlineNote}</p>

          <ButtonLink href="#paths" className="mt-4">
            {cta.primary}
          </ButtonLink>
        </div>
      </div>

      <div className="mt-6 border-t border-line pt-5 md:mt-8 md:pt-6">
        <p className="t-meta font-semibold text-ink-secondary">{course.includesLabel}</p>
        <ul className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2 md:gap-y-3 lg:grid-cols-3">
          {course.includes.map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <CheckIcon size={16} weight="bold" className="mt-0.5 flex-none text-ink" />
              <span className="t-body-sm text-ink-secondary">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
