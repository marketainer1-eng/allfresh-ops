import { Container } from "@/components/ui/Container";
import { Section, SectionHeader } from "@/components/ui/Section";
import { ecosystemRoles } from "@/content/home";

/**
 * CURRENT ECOSYSTEM
 * 현재 활동 기반을 "역할" 중심으로 보여준다.
 * 기관 관계를 과도하게 설명하지 않고, 화면 구조와 데이터 구조만 만든다.
 */
export function EcosystemSection() {
  return (
    <Section id="ecosystem" tone="soft" labelledBy="ecosystem-title">
      <Container width="wide">
        <SectionHeader
          eyebrow="NOW"
          title="CURRENT ECOSYSTEM"
          titleFont="sans"
          headingId="ecosystem-title"
          description="교육 · 산업 · 연구 · 미디어 · 지식으로 이어진 활동 기반입니다."
        />

        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ecosystemRoles.map((role) => (
            <div
              key={role.id}
              className="rounded-2xl border border-white bg-white/70 p-6"
            >
              <dt>
                <span className="eyebrow block text-[0.62rem] text-brand">
                  {role.roleEn}
                </span>
                <span className="mt-1 block text-xs text-ink-faint">
                  {role.roleKo}
                </span>
              </dt>
              <dd className="mt-4">
                <ul className="space-y-2">
                  {role.items.map((item) => (
                    <li
                      key={item}
                      className="border-l-2 border-brand/30 pl-3 text-sm font-medium text-ink"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
                {role.note ? (
                  <p className="mt-3 text-xs leading-relaxed text-ink-muted">
                    {role.note}
                  </p>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </Section>
  );
}
