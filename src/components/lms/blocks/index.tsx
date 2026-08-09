import { Prose } from "@/components/lms/prose";
import { signDocUrls, publicMediaUrl } from "@/lib/lms/media";
import type { LessonBlock } from "@/lib/supabase/types";
import { YouTubeBlock } from "./youtube";
import { AudioBlock } from "./audio";
import { AttachmentsBlock } from "./attachments";
import { QuizBlock } from "./quiz";
import { EmbedBlock } from "./embed";
import { ExerciseBlock } from "./exercise";
import { ChecklistBlock } from "./checklist";

/**
 * A lesson, rendered from its blocks.
 *
 * ---------------------------------------------------------- a server switch
 *
 * This component and the prose, doc and heading paths stay on the server, so a
 * lesson that is only prose ships no extra JavaScript at all — which is most of
 * them, and all 173 of them today. Only the six kinds that genuinely need state
 * cross the boundary, and each is its own island rather than one client tree
 * wrapping the page.
 *
 * -------------------------------------------------------------- signing docs
 *
 * Document URLs are signed once, for every doc block on the page, before
 * anything renders. `signDocUrls` takes the whole list because a lesson with
 * four attachments should cost one round trip — the obvious wrong version of
 * this is a `.map()` over a singular `createSignedUrl`, which costs four and
 * looks identical in review.
 *
 * ------------------------------------------------------- ordering is authored
 *
 * `position` is the author's order and nothing re-sorts it here. A lesson that
 * opens with a video, explains, plays the episode, then asks a question, is
 * exactly the row order in the table.
 */
export async function LessonBlocks({ blocks }: { blocks: readonly LessonBlock[] }) {
  const docPaths = blocks.flatMap((b) => (b.kind === "doc" ? [b.payload.path] : []));
  const signed = await signDocUrls(docPaths);

  return (
    <div className="mt-7 flex flex-col gap-8">
      {blocks.map((block) => {
        switch (block.kind) {
          case "prose":
            /* A reading measure, not the track width. The column is now wide
               enough for a 16:9 player, and prose set to that width is a 110ch
               line nobody can follow back to the left margin. Media blocks below
               deliberately do NOT get this cap. */
            return <Prose key={block.id} body={block.payload.md} className="max-w-[68ch]" />;

          case "video":
            return (
              <YouTubeBlock
                key={block.id}
                id={block.payload.youtube_id}
                title={block.title ?? "Lesson video"}
                poster={publicMediaUrl(block.payload.poster ?? "")}
              />
            );

          case "audio":
            return (
              <AudioBlock
                key={block.id}
                blockId={block.id}
                src={publicMediaUrl(block.payload.path)}
                title={block.title ?? "Episode"}
                duration={block.payload.duration}
                chapters={block.payload.chapters}
              />
            );

          case "doc":
            return (
              <AttachmentsBlock
                key={block.id}
                title={block.title}
                items={[
                  {
                    path: block.payload.path,
                    label: block.payload.title ?? block.payload.path.split("/").pop() ?? "Download",
                    bytes: block.payload.bytes,
                    href: signed.get(block.payload.path) ?? null,
                  },
                ]}
              />
            );

          case "quiz":
            return (
              <QuizBlock
                key={block.id}
                title={block.title}
                questions={block.payload.questions}
              />
            );

          case "embed":
            return (
              <EmbedBlock
                key={block.id}
                src={block.payload.src}
                height={block.payload.height}
                title={block.title ?? "Interactive"}
              />
            );

          case "exercise":
            return (
              <ExerciseBlock
                key={block.id}
                blockId={block.id}
                title={block.title}
                prompt={block.payload.prompt}
                placeholder={block.payload.placeholder}
              />
            );

          case "checklist":
            return (
              <ChecklistBlock
                key={block.id}
                blockId={block.id}
                title={block.title}
                steps={block.payload.steps}
              />
            );
        }
      })}
    </div>
  );
}
