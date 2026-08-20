import Link from "next/link";
import type { Project } from "@/content/types";
import { PlaceholderBadge } from "@/components/ui/Placeholder";

const statusLabel: Record<Project["status"], string> = {
  building: "BUILDING",
  running: "RUNNING",
  planned: "PLANNED",
  tbd: "TBD",
};

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-line bg-white p-6 transition-colors hover:border-brand/50">
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow text-[0.65rem] text-brand">
          {statusLabel[project.status]}
        </span>
        {project.category ? (
          <span className="text-xs text-ink-faint">{project.category}</span>
        ) : null}
      </div>

      <h3 className="mt-4 text-lg leading-snug text-ink">
        <Link
          href={`/projects/${project.slug}`}
          className="underline-offset-4 after:absolute after:inset-0 after:content-[''] group-hover:underline"
        >
          {project.title}
        </Link>
      </h3>

      {project.summary ? (
        <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-muted">
          {project.summary}
        </p>
      ) : (
        <p className="mt-3 flex-1 text-sm text-ink-faint">내용 준비 중입니다.</p>
      )}

      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="eyebrow text-[0.65rem] text-ink-faint">
          WHY · PROBLEM · BUILD · RESULT · NEXT
        </span>
        {project.isPlaceholder ? <PlaceholderBadge /> : null}
      </div>
    </article>
  );
}
