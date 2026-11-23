import { Container } from "@/components/ui/Container";
import { Section, SectionHeader } from "@/components/ui/Section";
import { expertiseAreas } from "@/content/home";

/**
 * PRESENT — WHERE I AM
 * 현재 전문영역을 에디토리얼 블록으로 보여준다.
 * 각 영역은 향후 BOOKS / PROJECTS / MEDIA / STORY 와 연결될 수 있도록
 * content/home.ts 의 related 슬롯을 그대로 갖고 있다.
 */
export function PresentSection() {
  return (
    <Section id="present" tone="white" labelledBy="present-title">
      <Container width="wide">
        <SectionHeader
          eyebrow="PRESENT"
          title="WHERE I AM"
          titleFont="sans"
          headingId="present-title"
          description="지금 연구하고 가르치는 여섯 개의 영역입니다."
        />

        <ul className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {expertiseAreas.map((area, i) => (
            <li key={area.id} className="bg-white p-6 sm:p-7">
              <div className="flex items-baseline gap-3">
                <span className="eyebrow text-[0.62rem] text-brand">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="eyebrow text-[0.68rem] text-ink-faint">
                  {area.labelEn}
                </span>
              </div>
              <h3 className="mt-3 font-sans text-lg font-semibold tracking-tight text-ink">
                {area.labelKo}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">
                {area.summary}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
