import type { Metadata } from "next";

import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { EmptyState } from "@/components/ui/Placeholder";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { JsonLd } from "@/components/seo/JsonLd";

import { getAllProjects } from "@/content/projects";
import type { BreadcrumbItem } from "@/content/types";
import { breadcrumbSchema, graph } from "@/lib/schema";
import { buildMetadata } from "@/lib/seo";

const breadcrumbs: BreadcrumbItem[] = [
  { name: "HOME", href: "/" },
  { name: "PROJECTS", href: "/projects" },
];

export const metadata: Metadata = buildMetadata({
  title: "PROJECTS",
  description:
    "고아라(KO A RA)가 만들고 있는 프로젝트. 각 프로젝트를 WHY · PROBLEM · BUILD · RESULT · NEXT 구조로 기록합니다.",
  path: "/projects",
});

export default function ProjectsIndexPage() {
  const projects = getAllProjects();

  return (
    <>
      <JsonLd data={graph(breadcrumbSchema(breadcrumbs))} />

      <PageHero
        eyebrow="PROJECTS"
        title="만들고 있는 것들"
        lead="왜 시작했고, 무엇이 문제였고, 무엇을 만들었고, 무엇이 달라졌고, 다음은 무엇인지 같은 구조로 기록합니다."
        breadcrumbs={breadcrumbs}
      />

      <Section tone="ivory">
        <Container width="wide">
          {projects.length > 0 ? (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <li key={project.slug}>
                  <ProjectCard project={project} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="등록된 프로젝트가 없습니다."
              description="프로젝트 정보가 확정되면 이곳에 목록이 표시됩니다."
            />
          )}
        </Container>
      </Section>
    </>
  );
}
