import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { PlaceholderText } from "@/components/ui/Placeholder";
import { JsonLd } from "@/components/seo/JsonLd";

import {
  getAllProjects,
  getProjectBySlug,
  projectSectionMeta,
} from "@/content/projects";
import type { BreadcrumbItem } from "@/content/types";
import { breadcrumbSchema, creativeWorkSchema, graph } from "@/lib/schema";
import { buildMetadata } from "@/lib/seo";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getAllProjects().map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project)
    return buildMetadata({ title: "PROJECTS", description: "", path: "/projects" });

  return buildMetadata({
    title: project.title,
    description:
      project.summary || `고아라(KO A RA)의 프로젝트 — ${project.title}`,
    path: `/projects/${project.slug}`,
    type: "article",
  });
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const path = `/projects/${project.slug}`;
  const breadcrumbs: BreadcrumbItem[] = [
    { name: "HOME", href: "/" },
    { name: "PROJECTS", href: "/projects" },
    { name: project.title, href: path },
  ];

  return (
    <>
      <JsonLd
        data={graph(
          creativeWorkSchema({
            name: project.title,
            description: project.summary,
            path,
          }),
          breadcrumbSchema(breadcrumbs),
        )}
      />

      <PageHero
        eyebrow="PROJECT"
        title={project.title}
        lead={project.subtitle || project.summary || undefined}
        breadcrumbs={breadcrumbs}
      >
        {project.period ? (
          <p className="text-xs text-white/50">{project.period}</p>
        ) : null}
      </PageHero>

      <Section tone="ivory">
        <Container width="narrow">
          {/*
            WHY / PROBLEM / BUILD / RESULT / NEXT — 모든 프로젝트 공통 템플릿.
            내용이 비어 있으면 임의 문구 대신 placeholder 를 노출한다.
          */}
          <div className="space-y-14">
            {projectSectionMeta.map((meta, i) => {
              const paragraphs = project.sections[meta.key];
              return (
                <article key={meta.key} aria-labelledby={`section-${meta.key}`}>
                  <header className="flex items-baseline gap-4 border-b border-line pb-3">
                    <span className="eyebrow text-[0.62rem] text-brand">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h2
                      id={`section-${meta.key}`}
                      className="font-sans text-lg font-bold tracking-[0.06em] text-ink sm:text-xl"
                    >
                      {meta.labelEn}
                    </h2>
                    <span className="text-xs text-ink-faint">
                      {meta.labelKo}
                    </span>
                  </header>

                  <div className="prose-ko mt-5">
                    {paragraphs.length > 0 ? (
                      paragraphs.map((p, idx) => (
                        <p key={idx} className="text-[0.97rem] text-ink-muted">
                          {p}
                        </p>
                      ))
                    ) : (
                      <PlaceholderText label="내용 준비 중" />
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <nav
            aria-label="PROJECTS 이동"
            className="mt-16 border-t border-line pt-8"
          >
            <Link
              href="/projects"
              className="text-sm text-brand underline-offset-4 hover:underline"
            >
              ← PROJECTS 목록으로
            </Link>
          </nav>
        </Container>
      </Section>
    </>
  );
}
