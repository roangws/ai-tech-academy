"use client";

import { useId, useState } from "react";
import { CameraIcon, CopyIcon, CheckIcon, LockSimpleIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { LiquidButton } from "@/components/ui/liquid-glass-button";

const choiceClass = "t-body-sm min-h-11 rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-accent";
function choice(active: boolean) { return `${choiceClass} ${active ? "border-accent bg-accent-tint text-accent" : "border-line bg-surface text-ink-secondary hover:border-accent"}`; }
const shots = [
  { name: "Wide", question: "Where are we?", meaning: "The environment tells the story. Use a wide shot to establish the place and show the subject's relationship to it.", task: "Open a location film with enough space to understand where the action happens." },
  { name: "Medium", question: "What is the person doing?", meaning: "The person and their action share the frame. A medium shot gives you room for gestures while keeping the subject easy to read.", task: "Use this framing for a presenter explaining a process or a person working with a product." },
  { name: "Close", question: "What does this moment feel like?", meaning: "The face takes priority over the environment. A close shot makes a reaction or a small change in expression easier to notice.", task: "Cut closer when the person's response matters more than the place around them." },
  { name: "Detail", question: "What should I notice?", meaning: "One small feature fills the frame. A detail shot directs attention to evidence: an eye, a texture, a control or a finished edge.", task: "For a product film, show the specific detail that supports the claim in the script." },
];
const beats = [
  { name: "Character", line: "It's the morning rush. Maya is trying to order coffee before work.", show: "A wide shot establishes the café. A medium shot introduces Maya and the queue.", purpose: "Give the viewer a person, a place and a reason to care." },
  { name: "Problem", line: "She wants to try something new, but can't tell what is in each drink.", show: "Cut to the unclear menu, then Maya's reaction. The problem should be visible.", purpose: "Make the obstacle specific enough that a solution can address it." },
  { name: "Plan", line: "The barista points her to a simple menu with ingredients and tasting notes.", show: "Use a medium shot for the exchange, then a readable detail of the menu.", purpose: "Introduce the guide and show an action the character can take." },
  { name: "Action", line: "Maya compares two drinks and chooses the one she wants.", show: "Show the comparison and the choice. Keep the menu detail and her hand in the same screen direction.", purpose: "Let the audience see the solution being used." },
  { name: "Result", line: "She collects her drink with a clear idea of what she ordered.", show: "Return to Maya, then end with the drink and a simple invitation to explore the menu.", purpose: "Resolve the original problem. The ending should deliver what the opening set up." },
];

function ShotExplorer() {
  const [selected, setSelected] = useState(0);
  const shot = shots[selected];
  return <>
    <h3 className="t-h3 text-ink">One subject. Four different messages.</h3>
    <p className="t-body-sm mt-2 text-ink-secondary">Choose a shot size and see what it asks the viewer to notice.</p>
    <div role="group" aria-label="Choose a shot size" className="my-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{shots.map((item, i) => <button type="button" key={item.name} className={choice(selected === i)} aria-pressed={selected === i} onClick={() => setSelected(i)}>{item.name}</button>)}</div>
    <div className="grid gap-5 sm:grid-cols-[1.1fr_1fr]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface-sunken">{shots.map((item,i) =>
        // Keep all four small photographs mounted so selection never flashes a loading image.
        /* eslint-disable-next-line @next/next/no-img-element */
        <img key={item.name} src={`/api/lesson-materials/2?image=shot-${i}`} alt={`${item.name} shot of the same person on a rooftop`} width={573} height={315} aria-hidden={i !== selected} className={`absolute inset-0 h-full w-full object-cover ${i === selected ? "visible" : "invisible"}`} />
      )}</div>
      <div aria-live="polite"><p className="t-label text-accent">{shot.question}</p><p className="t-body-sm mt-3 text-ink-secondary">{shot.meaning}</p><p className="t-body-sm mt-4 border-l-2 border-accent pl-3 text-ink">{shot.task}</p></div>
    </div>
  </>;
}

function StoryExplorer() {
  const [selected,setSelected] = useState(0);
  const beat = beats[selected];
  return <>
    <h3 className="t-h3 text-ink">Build a story the camera can show</h3>
    <p className="t-body-sm mt-2 text-ink-secondary">Example brief: introduce a café&apos;s new menu. Select each beat to connect the script to a shot.</p>
    <ol aria-label="Story beats" className="my-5 grid grid-cols-2 gap-2 sm:grid-cols-5">{beats.map((item,i) => <li key={item.name}><button type="button" className={`${choice(i === selected)} h-full w-full`} aria-pressed={i === selected} onClick={() => setSelected(i)}><span className="t-meta mb-1 block tabular-nums">0{i+1}</span>{item.name}</button></li>)}</ol>
    <div aria-live="polite" className="rounded-xl border border-line bg-surface p-5">
      <p className="t-label text-accent">{selected + 1} / 5 · {beat.name}</p>
      <p className="mt-3 text-xl leading-relaxed font-medium text-ink">{beat.line}</p>
      <div className="mt-5 flex items-start gap-3 border-t border-line pt-4"><CameraIcon size={24} className="shrink-0 text-accent" aria-hidden="true" /><div><p className="t-card-title text-ink">What to show</p><p className="t-body-sm mt-1 text-ink-secondary">{beat.show}</p></div></div>
      <p className="t-body-sm mt-4 text-ink-secondary">{beat.purpose}</p>
    </div>
    <button type="button" onClick={() => setSelected((selected+1)%beats.length)} className="t-body-sm mt-3 inline-flex min-h-11 items-center gap-2 text-accent underline underline-offset-4">{selected === beats.length-1 ? "Start the story again" : "Next story beat"}<ArrowRightIcon size={16} aria-hidden="true" /></button>
  </>;
}

function ReferencePlanner() {
  const [locked,setLocked] = useState([true,true,true]);
  const [setting,setSetting] = useState("a quiet café");
  const [copyStatus,setCopyStatus] = useState("");
  const id = useId();
  const rules = ["Subject identity", "Wardrobe", "Light direction"];
  const instructions = ["Preserve the subject's face, proportions and distinguishing features.", "Keep the same clothing, colors and accessories.", "Keep the reference light direction and shadow pattern."];
  const prompt = `Use the approved reference image. Change the background to ${setting}. ${instructions.filter((_,i)=>locked[i]).join(" ")} Keep the camera framing consistent. Return one still image for review before animation.`;
  return <>
    <h3 className="t-h3 text-ink">Decide what can change</h3>
    <p className="t-body-sm mt-2 text-ink-secondary">Build a reference brief for a new background. Choose what must stay consistent, then copy the brief into your project.</p>
    <div className="mt-5 grid gap-5 sm:grid-cols-2"><div>
      <label htmlFor={id} className="t-card-title block text-ink">New setting</label>
      <select id={id} value={setting} onChange={event => { setSetting(event.target.value); setCopyStatus(""); }} className="t-body-sm mt-2 min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-ink"><option>a quiet café</option><option>a city rooftop at sunset</option><option>a bright studio</option></select>
      <fieldset className="mt-5"><legend className="t-card-title text-ink">Keep from the reference</legend><div className="mt-2 space-y-2">{rules.map((rule,i) => <label key={rule} className="t-body-sm flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-line bg-surface px-3 text-ink"><input type="checkbox" checked={locked[i]} onChange={() => { setLocked(locked.map((value,n)=>n === i ? !value : value)); setCopyStatus(""); }} className="size-4 accent-[var(--accent)]" />{rule}{locked[i] && <LockSimpleIcon size={16} className="ml-auto text-accent" aria-hidden="true" />}</label>)}</div></fieldset>
    </div><div className="rounded-xl border border-accent/25 bg-accent-tint p-4"><p className="t-label text-accent">Your reference brief</p><p aria-live="polite" className="t-body-sm mt-3 text-ink">{prompt}</p></div></div>
    <p className="t-body-sm mt-4 text-ink-secondary">{locked.every(Boolean) ? "You have specified identity, wardrobe and lighting. Compare the result against the reference before animating it." : "An unchecked detail is no longer explicitly protected in this brief. Check whether that change would break continuity with the next shot."} A written rule guides the model; you still need to inspect the result.</p>
    <div className="mt-4 flex flex-wrap items-center gap-3"><LiquidButton type="button" size="md" onClick={async()=>{try { await navigator.clipboard.writeText(prompt); setCopyStatus("Brief copied."); } catch { setCopyStatus("Copy unavailable. Select the brief above and copy it manually."); }}}>{copyStatus === "Brief copied." ? <CheckIcon size={17} aria-hidden="true" /> : <CopyIcon size={17} aria-hidden="true" />}Copy reference brief</LiquidButton><span role="status" className="t-meta text-ink-secondary">{copyStatus}</span></div>
  </>;
}

export function FilmmakingConcept({ index }: { index: number }) {
  if (![1,2,3].includes(index)) return null;
  return <section aria-label="Interactive class exercise" className="mt-8 rounded-[var(--radius-feature)] border border-line bg-surface-subtle p-5 sm:p-6"><p className="t-label mb-3 text-accent">Try the idea</p>{index === 1 ? <ShotExplorer /> : index === 2 ? <StoryExplorer /> : <ReferencePlanner />}</section>;
}
