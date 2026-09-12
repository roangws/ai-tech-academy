import { Photo, Section } from "@/components/ui";
import { teams } from "@/lib/content";
import { getCatalog } from "@/lib/catalog";
import { TeamTrainingForm } from "@/components/team-training-form";

export async function Teams() {
  const courses = (await getCatalog()).map(({ slug, title }) => ({ slug, title }));
  return <Section id="teams" compressed>
    <div className="overflow-hidden rounded-[var(--radius-feature)] bg-ink-band">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
        <figure className="relative m-0 aspect-[16/8] sm:aspect-[21/9] lg:aspect-auto lg:h-full lg:min-h-[460px]">
          <Photo image={teams.image} width={1200} height={1400} sizes="(max-width: 1024px) 100vw, 460px" className="object-[center_42%]" />
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-linear-to-t from-[rgb(13_26_34/0.92)] to-transparent lg:bg-linear-to-r lg:from-transparent lg:to-[rgb(13_26_34)]" />
        </figure>
        <div className="p-5 md:p-8 lg:p-10">
          <p className="t-label text-white/60">For companies and teams</p>
          <h2 className="t-h2 mt-2 text-white">Bring AI training to your team</h2>
          <p className="t-body mt-3 text-[#c3d2dc]">Choose the courses your team needs. Tell us your goals, and we’ll help plan the training.</p>
          <TeamTrainingForm courses={courses} />
        </div>
      </div>
    </div>
  </Section>;
}
