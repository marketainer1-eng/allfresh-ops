import { Container } from "@/components/ui/Container";
import { Section, SectionHeader } from "@/components/ui/Section";
import { ExpertIpDiagram } from "@/components/diagrams/ExpertIpDiagram";
import { VerticalAiDiagram } from "@/components/diagrams/VerticalAiDiagram";
import { expertIpNodes, verticalAiFlow, verticalDomains } from "@/content/home";

/**
 * FUTURE — WHAT I AM BUILDING
 * 두 개의 핵심 시스템을 HTML/CSS 다이어그램으로 보여준다.
 */
export function FutureSection() {
  return (
    <Section id="future" tone="navy" labelledBy="future-title">
      <Container width="wide">
        <SectionHeader
          eyebrow="FUTURE"
          title="WHAT I AM BUILDING"
          titleFont="sans"
          headingId="future-title"
          tone="dark"
          description="Vertical AI Ecosystem 과 Expert IP Ecosystem, 두 개의 시스템을 만들고 있습니다."
        />

        <div className="space-y-16 lg:space-y-24">
          {/* A. VERTICAL AI ECOSYSTEM */}
          <article aria-labelledby="vertical-ai-title">
            <header className="mb-8">
              <p className="eyebrow text-[0.62rem] text-brand-light">A</p>
              <h3
                id="vertical-ai-title"
                className="mt-2 font-sans text-xl font-bold tracking-[0.03em] text-white sm:text-2xl"
              >
                VERTICAL AI ECOSYSTEM
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
                산업마다 필요한 AI는 다릅니다. 산업 특성에 맞춘 AI 활용에서
                창업 · 마케팅 · 교육 · 출판 · 전문가 · 프로젝트까지 이어지는
                구조를 만듭니다.
              </p>
            </header>
            <VerticalAiDiagram
              flow={verticalAiFlow}
              domains={verticalDomains}
            />
          </article>

          {/* B. EXPERT IP ECOSYSTEM */}
          <article aria-labelledby="expert-ip-title">
            <header className="mb-8">
              <p className="eyebrow text-[0.62rem] text-brand-light">B</p>
              <h3
                id="expert-ip-title"
                className="mt-2 font-sans text-xl font-bold tracking-[0.03em] text-white sm:text-2xl"
              >
                EXPERT IP ECOSYSTEM
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
                전문가의 지식과 경험은 한 가지 형식에서 시작하지 않습니다.
                책 · 칼럼 · SNS · 영상 · 오디오 · 인강 · 강의안 · 프로젝트 경험 ·
                인터뷰가 서로 전환되며 권위와 브랜드를 만들고, 다시 강의 ·
                컨설팅 · 프로젝트 · 협업으로 이어집니다.
              </p>
            </header>
            <ExpertIpDiagram nodes={expertIpNodes} />
          </article>
        </div>
      </Container>
    </Section>
  );
}
