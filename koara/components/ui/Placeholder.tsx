import type { ReactNode } from "react";

/**
 * Phase 1 에서 "내용이 아직 없다"는 사실을 명확히 보여주는 UI.
 * 임의의 문구로 빈 곳을 메우지 않기 위한 장치다.
 */
export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white/60 px-6 py-12 text-center">
      <p className="font-serif text-lg text-ink">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}

/** 본문 자리에 들어가는 인라인 placeholder */
export function PlaceholderText({
  label = "원고 준비 중",
}: {
  label?: string;
}) {
  return (
    <p className="rounded-lg border border-dashed border-line bg-white/60 px-4 py-3 text-sm text-ink-faint">
      {label}
    </p>
  );
}

/** 데이터 담당자용 안내 배지 */
export function PlaceholderBadge({ label = "PLACEHOLDER" }: { label?: string }) {
  return (
    <span className="eyebrow inline-flex items-center rounded-full border border-line bg-white px-2.5 py-1 text-[0.6rem] text-ink-faint">
      {label}
    </span>
  );
}
