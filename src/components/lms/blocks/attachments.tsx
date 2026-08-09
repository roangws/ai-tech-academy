import { FileArrowDownIcon } from "@phosphor-icons/react/dist/ssr";
import { fileSize } from "@/lib/lms/format";

/**
 * Downloadable documents.
 *
 * A server component: a link is a link, and nothing here needs state.
 *
 * `href` arrives already signed. Documents live in a private bucket, so the URL
 * is minted per render with a one-hour life — which is why the size comes from
 * `payload.bytes`, recorded by the uploader, rather than from a HEAD request.
 * Rendering a file list should not cost one request per file.
 *
 * A row with no href renders as text rather than as a dead link. That happens
 * when signing fails for one object, and one broken attachment should cost that
 * attachment, not the lesson.
 */
export function AttachmentsBlock({
  title,
  items,
}: {
  title: string | null;
  items: readonly { path: string; label: string; bytes?: number; href: string | null }[];
}) {
  return (
    <section>
      {title ? <h2 className="t-h3 text-ink">{title}</h2> : null}
      <ul className="mt-3 flex flex-col gap-2">
        {items.map((item) => {
          const size = fileSize(item.bytes);
          const ext = item.path.split(".").pop()?.toUpperCase();
          const body = (
            <>
              <span className="grid size-10 flex-none place-items-center rounded-[var(--radius-control)] border border-line bg-surface-subtle text-ink-secondary">
                <FileArrowDownIcon size={18} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="t-body-sm block truncate text-ink">{item.label}</span>
                <span className="t-meta text-ink-muted">
                  {[ext, size].filter(Boolean).join(" · ")}
                </span>
              </span>
            </>
          );

          return (
            <li key={item.path}>
              {item.href ? (
                <a
                  href={item.href}
                  download
                  className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-3 no-underline transition-colors hover:border-line-strong"
                >
                  {body}
                </a>
              ) : (
                <span className="flex items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-line bg-surface p-3 opacity-70">
                  {body}
                  <span className="t-meta text-ink-muted">unavailable</span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
