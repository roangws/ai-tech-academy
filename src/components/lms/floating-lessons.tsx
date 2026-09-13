"use client";

import { useId, type PointerEvent } from "react";
import Link from "next/link";
import { motion, useSpring, useReducedMotion } from "motion/react";
import { PlayIcon, CheckCircleIcon, ArrowUpRightIcon } from "@phosphor-icons/react";
import { filmmakingLessons, filmmakingHref, filmmakingPoster } from "@/lib/filmmaking-lessons";
import styles from "./floating-lessons.module.css";

function LessonCover({ index, done, requireLogin }: { index: number; done: boolean; requireLogin: boolean }) {
  const lesson = filmmakingLessons[index];
  const reduced = useReducedMotion();
  const rotateX = useSpring(0, { stiffness: 160, damping: 24 });
  const rotateY = useSpring(0, { stiffness: 160, damping: 24 });
  function move(event: PointerEvent<HTMLAnchorElement>) {
    if (reduced || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    rotateX.set(-((event.clientY - rect.top) / rect.height - .5) * 7);
    rotateY.set(((event.clientX - rect.left) / rect.width - .5) * 7);
  }
  function reset() { rotateX.set(0); rotateY.set(0); }
  const href = filmmakingHref(index);
  return <li className={styles.slot}>
    <Link href={requireLogin ? `/sign-in?next=${encodeURIComponent(href)}` : href} className={styles.card} onPointerMove={move} onPointerLeave={reset} onPointerCancel={reset} onBlur={reset} aria-label={`Lesson ${index + 1}: ${lesson.title}${done ? ", completed" : ""}`}>
      <motion.div className={styles.visual} style={{ rotateX, rotateY, transformPerspective: 1000 }}>
      <div className={styles.cover}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={filmmakingPoster(lesson)} alt="" width={480} height={270} loading="lazy" />
        <span className={styles.play} aria-hidden="true"><PlayIcon size={19} weight="fill" /></span>
        {done && <CheckCircleIcon className={styles.check} size={23} weight="fill" aria-hidden="true" />}
      </div>
      <div className={styles.caption}><span className={styles.number}>{String(index + 1).padStart(2,"0")}</span><span className={styles.title}>{lesson.title}</span><ArrowUpRightIcon className={styles.arrow} size={15} aria-hidden="true" /></div>
      </motion.div>
    </Link>
  </li>;
}

export function FloatingLessons({ completed = [], preview = false, requireLogin = false }: { completed?: number[]; preview?: boolean; requireLogin?: boolean }) {
  const headingId = useId();
  const Heading = preview ? "h2" : "h3";
  return <section aria-labelledby={headingId} className={styles.section}>
    <div className={styles.heading}><div>
      {preview && <p className="t-label mb-3 text-accent">Inside hybrid filmmaking</p>}
      <Heading id={headingId} className={preview ? "t-h2 text-ink" : "t-h3 text-ink"}>{preview ? "Learn hybrid filmmaking in 10 classes" : "Your next scene starts here"}</Heading>
      <p className="t-body-sm mt-2 max-w-[64ch] text-ink-secondary">{preview ? "Start with framing and storytelling, learn how AI fits into production, then make your own videos. Select any class below to see its lesson and practical exercises." : "Ten lessons. Choose a cover and start watching."}</p>
    </div></div>
    <div className={styles.stage}><ol className={styles.wall}>{filmmakingLessons.map((lesson, i) => <LessonCover key={lesson.slug} index={i} done={completed.includes(i)} requireLogin={requireLogin} />)}</ol></div>
    <p className="t-meta text-ink-muted">{preview ? "10 video lessons · About 6 hours total · Complete in 2 weeks" : "Opening a video marks that lesson done. You can change it back inside the lesson."}</p>
  </section>;
}
