import type { MediaItem } from "@/content/types";
import { ExternalIcon } from "@/components/ui/Button";

/**
 * 외부 채널 링크 카드.
 * - 외부 콘텐츠 전문을 복제하지 않고 요약 + 원문 링크만 제공한다.
 * - externalUrl 이 비어 있으면 앵커가 아니라 비활성 블록으로 렌더한다.
 */
export function MediaCard({
  item,
  tone = "light",
}: {
  item: MediaItem;
  tone?: "light" | "dark";
}) {
  const isDark = tone === "dark";
  const hasLink = item.externalUrl.trim() !== "";

  const shell = isDark
    ? "border-line-navy bg-navy-soft"
    : "border-line bg-white";
  const hover = hasLink
    ? isDark
      ? "transition-colors hover:border-brand-light/60"
      : "transition-colors hover:border-brand/50"
    : "";

  const body = (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span
          className={`eyebrow text-[0.62rem] ${
            isDark ? "text-brand-light" : "text-brand"
          }`}
        >
          {item.type}
        </span>
        <span
          className={`text-xs ${isDark ? "text-white/55" : "text-ink-faint"}`}
        >
          {item.channel}
        </span>
        {item.date ? (
          <time
            dateTime={item.date}
            className={`text-xs ${isDark ? "text-white/45" : "text-ink-faint"}`}
          >
            {item.date}
          </time>
        ) : null}
      </div>

      <h3
        className={`mt-3 flex items-center gap-2 text-base leading-snug ${
          isDark ? "text-white" : "text-ink"
        }`}
      >
        {item.title}
        {hasLink ? (
          <ExternalIcon
            className={isDark ? "text-brand-light" : "text-brand"}
          />
        ) : null}
      </h3>

      {item.description ? (
        <p
          className={`mt-2.5 text-sm leading-relaxed ${
            isDark ? "text-white/65" : "text-ink-muted"
          }`}
        >
          {item.description}
        </p>
      ) : null}

      <p
        className={`mt-4 text-xs ${
          isDark ? "text-white/40" : "text-ink-faint"
        }`}
      >
        {hasLink ? "외부 채널에서 원문 보기" : "링크 준비 중"}
      </p>
    </>
  );

  if (!hasLink) {
    return (
      <div className={`rounded-2xl border border-dashed p-6 ${shell}`}>
        {body}
      </div>
    );
  }

  return (
    <a
      href={item.externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`block rounded-2xl border p-6 ${shell} ${hover}`}
    >
      {body}
      <span className="sr-only">(새 창으로 열리는 외부 링크)</span>
    </a>
  );
}
