import type { Metadata } from "next";

import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/Container";
import { Section, SectionHeader } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/Button";
import { ExpertIpDiagram } from "@/components/diagrams/ExpertIpDiagram";
import { VerticalAiDiagram } from "@/components/diagrams/VerticalAiDiagram";
import { JsonLd } from "@/components/seo/JsonLd";

import { expertIpNodes, verticalAiFlow, verticalDomains } from "@/content/home";
import type { BreadcrumbItem } from "@/content/types";
import { breadcrumbSchema, graph } from "@/lib/schema";
import { buildMetadata } from "@/lib/seo";

const breadcrumbs: BreadcrumbItem[] = [
  { name: "HOME", href: "/" },
  { name: "VISION", href: "/vision" },
];

export const metadata: Metadata = buildMetadata({
  title: "VISION",
  description:
    "고아라(KO A RA)가 만들고 있는 두 개의 시스템 — Vertical AI Ecosystem 과 Expert IP Ecosystem 을 소개합니다.",
  path: "/vision",
});

export default function VisionPage() {
  return (
    <>
      <JsonLd data={graph(breadcrumbSchema(breadcrumbs))} />

      <PageHero
        eyebrow="VISION"
        title="WHAT I AM BUILDING"
        titleFont="sans"
        lead="AI는 검색과 추천, 마케팅과 판매를 다시 설계하고 있습니다. 그 변화를 산업별로 쓰이게 만드는 구조와, 전문가의 지식이 계속 순환하도록 만드는 구조를 만들고 있습니다."
        breadcrumbs={breadcrumbs}
      />

      {/* A. VERTICAL AI ECOSYSTEM */}
      <Section tone="navy" labelledBy="vision-vertical-ai">
        <Container width="wide">
          <SectionHeader
            eyebrow="A"
            title="VERTICAL AI ECOSYSTEM"
            titleFont="sans"
            headingId="vision-vertical-ai"
            tone="dark"
            description="산업마다 필요한 AI는 다릅니다. 산업 특성에 맞춘 AI 활용에서 창업 · 마케팅 · 교육 · 출판 · 전문가 · 프로젝트까지 이어지는 구조를 만듭니다."
          />
          <VerticalAiDiagram flow={verticalAiFlow} domains={verticalDomains} />
        </Container>
      </Section>

      {/* B. EXPERT IP ECOSYSTEM */}
      <Section tone="navy" className="border-t border-line-navy" labelledBy="vision-expert-ip">
        <Container width="wide">
          <SectionHeader
            eyebrow="B"
            title="EXPERT IP ECOSYSTEM"
            titleFont="sans"
            headingId="vision-expert-ip"
            tone="dark"
            description="전문가의 지식과 경험은 한 가지 형식에서 시작하지 않습니다. 책 · 칼럼 · SNS · 영상 · 오디오 · 인강 · 강의안 · 프로젝트 경험 · 인터뷰가 서로 전환되며 권위와 브랜드를 만들고, 다시 강의 · 컨설팅 · 프로젝트 · 협업으로 이어집니다."
          />
          <ExpertIpDiagram nodes={expertIpNodes} />
        </Container>
      </Section>

      <Section tone="ivory">
        <Container width="narrow">
          <div className="text-center">
            <p className="eyebrow text-[0.7rem] text-brand">NEXT</p>
            <h2 className="mt-4 text-2xl leading-snug text-ink sm:text-3xl">
              이 구조가 어디에서 시작됐는지 궁금하다면
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <LinkButton href="/story">MY STORY</LinkButton>
              <LinkButton href="/projects" variant="outline">
                PROJECTS
              </LinkButton>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
