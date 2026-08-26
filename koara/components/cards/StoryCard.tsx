import Link from "next/link";
import type { Story } from "@/content/types";
import { PlaceholderBadge } from "@/components/ui/Placeholder";

export function StoryCard({ story, index }: { story: Story; index: number }) {
  const order = String(index + 1).padStart(2, "0");

  return (
    <article className="group relative flex h-full flex-col border-t-2 border-ink/10 pt-5 transition-colors hover:border-brand">
      <p className="eyebrow text-xs text-brand">{order}</p>

      <h3 className="mt-3 text-lg leading-snug text-ink sm:text-xl">
        <Link
          href={`/story/${story.slug}`}
          className="underline-offset-4 after:absolute after:inset-0 after:content-[''] group-hover:underline"
        >
          {story.title}
        </Link>
      </h3>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-muted">
        {story.summary}
      </p>

      <div className="mt-5 flex items-center gap-3">
        <span className="eyebrow text-[0.65rem] text-ink-faint">READ</span>
        {story.isPlaceholder ? <PlaceholderBadge /> : null}
      </div>
    </article>
  );
}
