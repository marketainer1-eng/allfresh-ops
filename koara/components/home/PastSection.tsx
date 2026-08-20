import { Container } from "@/components/ui/Container";
import { Section, SectionHeader } from "@/components/ui/Section";
import { PastTimeline } from "@/components/diagrams/PastTimeline";
import { pastTimeline } from "@/content/home";

export function PastSection() {
  return (
    <Section id="past" tone="ivory" labelledBy="past-title">
      <Container width="wide">
        <SectionHeader
          eyebrow="PAST"
          title="WHERE I STARTED"
          titleFont="sans"
          headingId="past-title"
          description="이커머스 현장에서 출발해 AI로 이어진 경로입니다."
        />
        <PastTimeline steps={pastTimeline} />
      </Container>
    </Section>
  );
}
