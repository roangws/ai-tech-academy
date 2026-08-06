import { Photo, Section, SectionHeader } from "@/components/ui";
import { studio } from "@/lib/content";

/**
 * The studio band, and the only place on the page that runs photographs large.
 *
 * Rebuilt on this pass for two reasons.
 *
 * The frame count went from four to three, because the one that went showed a
 * person this site has no name for, in a band about who records the lessons.
 * Its caption and its alt text had both been written to name nobody, and a
 * photograph that has to be captioned around does not belong on the page.
 *
 * And four equal 220px tiles were the least visual arrangement available for
 * the page's only photographs. This is a mosaic: one tall feature at roughly
 * two thirds of the row, two stacked beside it. The feature carries a caption
 * plate over the frame rather than under it, so the largest photograph on the
 * page is not paying for a caption strip out of its own height.
 *
 * The caption rule is unchanged. Each one describes what its frame shows and
 * stops there, since a caption that assigns a role or an event to a frame is
 * the same fabrication the imagery policy bans, written in words.
 */
export function Studio() {
  const [feature, ...rest] = studio.frames;

  return (
    <Section id="studio" tint ariaLabelledBy="studio-heading">
      <SectionHeader
        id="studio-heading"
        label={studio.label}
        heading={studio.headline}
        intro={studio.intro}
      />

      {/*
        Two rows at lg so the pair on the right stacks to the feature's height.
        Below lg the three run as one column at a fixed height, where a mosaic
        has no width to express itself and would only crop harder.
      */}
      <ul className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:grid-rows-2">
        <li className="lg:col-span-2 lg:row-span-2">
          <figure className="relative m-0 h-[260px] overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface-sunken sm:h-[340px] lg:h-full lg:min-h-[440px]">
            <Photo
              image={feature.image}
              width={1600}
              height={900}
              sizes="(max-width: 1024px) 100vw, 66vw"
            />
            {/* Caption over the frame, on one solid value so contrast holds
                against any part of the photograph underneath it. */}
            <figcaption className="t-meta absolute inset-x-0 bottom-0 bg-[rgb(13_26_34/0.82)] px-4 py-3 text-white">
              {feature.caption}
            </figcaption>
          </figure>
        </li>

        {rest.map((frame) => (
          <li key={frame.id}>
            <figure className="m-0 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface lg:h-full">
              <div className="relative h-[200px] bg-surface-sunken lg:h-[calc(100%-42px)] lg:min-h-[170px]">
                <Photo
                  image={frame.image}
                  width={1200}
                  height={800}
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
              </div>
              <figcaption className="t-meta flex h-[42px] items-center px-3.5 text-ink-secondary">
                {frame.caption}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </Section>
  );
}
