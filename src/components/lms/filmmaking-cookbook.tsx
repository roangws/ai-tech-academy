import Link from "next/link";
import { BookOpenIcon, DownloadSimpleIcon, CheckCircleIcon, FolderOpenIcon, ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink } from "@/components/ui";
import { filmmakingCookbook, videoKits, type CookbookStep, type VideoKit } from "@/lib/filmmaking-cookbook";
import { CookbookPrompt } from "./cookbook-prompt";

function Steps({ steps }: { steps: CookbookStep[] }) {
  return <ol className="mt-5 space-y-6">{steps.map(([title, text], i) => <li key={title} className="flex gap-4">
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-tint text-sm font-semibold tabular-nums text-accent" aria-hidden="true">{i + 1}</span>
    <div className="min-w-0"><h5 className="t-card-title text-ink">{title}</h5><p className="t-body-sm mt-1.5 text-ink-secondary">{text}</p></div>
  </li>)}</ol>;
}
function Checks({ items }: { items: string[] }) {
  return <div className="mt-6 border-t border-line pt-5"><h5 className="t-card-title text-ink">Before you call it finished</h5><ul className="mt-3 space-y-3">{items.map(text => <li key={text} className="t-body-sm flex items-start gap-2.5 text-ink-secondary"><CheckCircleIcon size={19} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />{text}</li>)}</ul></div>;
}
function KitRecipe({ kit }: { kit: VideoKit }) {
  return <article id={`kit-${kit.id}`} className="mt-6 scroll-mt-24">
    <h4 className="t-h3 text-ink">{kit.title}</h4>
    <p className="t-body-sm mt-2 text-ink-secondary">{kit.goal}</p>
    <div className="mt-5 rounded-[var(--radius-card)] border border-accent/25 bg-accent-tint p-4 sm:p-5">
      <div className="flex items-start gap-3"><FolderOpenIcon size={26} weight="duotone" className="shrink-0 text-accent" aria-hidden="true" /><div><h5 className="t-card-title text-ink">Use this skill in Claude Code or Codex</h5><p className="t-body-sm mt-1 text-ink-secondary">Download and unzip the complete kit. It includes the skill, scripts, rules, and START-HERE.md. Open the whole folder in Claude Code or Codex.</p></div></div>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
        <ButtonLink href={`/api/course-kits/${kit.id}`} download prefetch={false} size="md"><DownloadSimpleIcon size={17} aria-hidden="true" />Download {kit.id === "micro-drama" ? "series" : kit.id} kit</ButtonLink>
        <a href={`/api/course-kits/${kit.id}?file=skill`} download className="t-body-sm inline-flex min-h-11 items-center gap-2 text-accent underline underline-offset-4"><DownloadSimpleIcon size={17} aria-hidden="true" />Download skill only</a>
      </div>
      <p className="t-meta mt-3 text-ink-secondary">The complete kit is recommended. The skill alone needs the kit&apos;s scripts and reference files.</p>
    </div>
    <div className="mt-5 grid gap-4 sm:grid-cols-2"><div><h5 className="t-card-title text-ink">Have this ready</h5><p className="t-body-sm mt-2 text-ink-secondary">{kit.needs}</p></div><div><h5 className="t-card-title text-ink">What you will make</h5><p className="t-body-sm mt-2 text-ink-secondary">{kit.output}</p></div></div>
    <Steps steps={kit.steps} />
    <CookbookPrompt key={kit.id} prompt={kit.prompt} />
    <Checks items={kit.check} />
    <p className="t-meta mt-5 text-ink-secondary">{kit.cost}</p>
  </article>;
}
export function FilmmakingCookbook({ index }: { index: number }) {
  const recipe = filmmakingCookbook[index];
  return <section id="hands-on" aria-labelledby="hands-on-heading" className="mt-8 scroll-mt-24 rounded-[var(--radius-feature)] border border-line bg-surface-subtle p-5 sm:p-7">
    <div className="flex items-center gap-3"><BookOpenIcon size={26} weight="duotone" className="text-accent" aria-hidden="true" /><h3 id="hands-on-heading" className="t-h3 text-ink">Hands-on cookbook</h3></div>
    <p className="t-body-sm mt-2 text-ink-secondary">Use this lesson to move your own project forward. Follow the steps, then check the result against your client&apos;s brief.</p>
    {index === 0 && <div className="mt-6"><h4 className="t-card-title text-ink">Choose your use case</h4><div className="mt-3 grid gap-2 sm:grid-cols-2">{Object.values(videoKits).map(kit => <Link key={kit.id} href={`/learn/hybrid-filmmaking?lesson=${kit.lesson}#kit-${kit.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3 text-ink no-underline hover:border-accent"><span><span className="t-body-sm block font-medium">{kit.title}</span><span className="t-meta text-ink-muted">Lesson {kit.lesson} · Skill included</span></span><ArrowRightIcon size={16} className="shrink-0 text-accent" aria-hidden="true" /></Link>)}</div></div>}
    {recipe.kits.length ? <>
      {recipe.kits.length > 1 && <p className="t-body-sm mt-5 text-ink-secondary">Choose the launch film for a narrated product introduction, or the vertical ad for a music-led offer. Each recipe has its own kit.</p>}
      <KitRecipe kit={videoKits[recipe.kits[0]]} />
      {recipe.kits.slice(1).map(id => <div key={id} className="mt-8 border-t border-line pt-5"><KitRecipe kit={videoKits[id]} /></div>)}
    </> : <>
      <h4 className="t-h3 mt-6 text-ink">{recipe.title}</h4>
      <p className="t-body-sm mt-2 text-ink-secondary">{recipe.goal}</p>
      <p className="t-body-sm mt-3 text-ink"><span className="font-medium">You will finish with: </span>{recipe.output}</p>
      <Steps steps={recipe.steps} /><Checks items={recipe.check} />
      <p className="t-body-sm mt-5 text-ink-secondary">Keep this work with your project. The practical lessons include the downloadable skills and production kits.</p>
    </>}
  </section>;
}
