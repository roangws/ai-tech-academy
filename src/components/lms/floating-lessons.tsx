"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { PauseIcon, PlayIcon, CheckCircleIcon, ArrowUpRightIcon } from "@phosphor-icons/react";
import { filmmakingLessons, filmmakingHref, filmmakingPoster } from "@/lib/filmmaking-lessons";
import styles from "./floating-lessons.module.css";

export function FloatingLessons({ completed }: { completed: number[] }) {
  const [paused, setPaused] = useState(false);
  return <section aria-labelledby="lesson-wall-heading" className={styles.section}>
    <div className={styles.heading}>
      <div><h3 id="lesson-wall-heading" className="t-h3 text-ink">Your next scene starts here</h3><p className="t-body-sm mt-2 text-ink-secondary">Ten lessons. Choose a cover and start watching.</p></div>
      <button type="button" onClick={() => setPaused(!paused)} aria-pressed={paused} className={styles.pause}>
        {paused ? <PlayIcon size={16} aria-hidden="true" /> : <PauseIcon size={16} aria-hidden="true" />}{paused ? "Resume motion" : "Pause motion"}
      </button>
    </div>
    <div className={styles.stage} data-paused={paused}>
      <ol className={styles.wall}>
        {filmmakingLessons.map((lesson, i) => <li key={lesson.slug} className={styles.slot} style={{ "--roll": `${[-3,2,-2,3,-2,2,-3,2,-2,3][i]}deg`, "--delay": `${-i * 0.8}s`, "--lift": `${[10,-7,5,-10,8,-4,8,-8,6,-5][i]}px` } as CSSProperties}>
          <Link href={filmmakingHref(i)} className={styles.card} aria-label={`Lesson ${i + 1}: ${lesson.title}${completed.includes(i) ? ", completed" : ""}`}>
            <div className={styles.cover}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={filmmakingPoster(lesson)} alt="" width={480} height={270} loading="lazy" />
              <span className={styles.play} aria-hidden="true"><PlayIcon size={19} weight="fill" /></span>
              {completed.includes(i) && <CheckCircleIcon className={styles.check} size={23} weight="fill" aria-hidden="true" />}
            </div>
            <div className={styles.caption}><span className={styles.number}>{String(i + 1).padStart(2,"0")}</span><span className={styles.title}>{lesson.title}</span><ArrowUpRightIcon className={styles.arrow} size={15} aria-hidden="true" /></div>
          </Link>
        </li>)}
      </ol>
    </div>
    <p className="t-meta text-ink-muted">Opening a video marks that lesson done. You can change it back inside the lesson.</p>
  </section>;
}
