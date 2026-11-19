import type { Metadata } from "next";

import { Hero } from "@/components/home/Hero";
import { PastSection } from "@/components/home/PastSection";
import { PresentSection } from "@/components/home/PresentSection";
import { EcosystemSection } from "@/components/home/EcosystemSection";
import { FutureSection } from "@/components/home/FutureSection";
import {
  AboutCtaSection,
  BooksSection,
  FeaturedStorySection,
  FollowSection,
  MediaSection,
  ProjectsSection,
} from "@/components/home/HomeCollections";

import { site } from "@/content/site";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildMetadata({
    title: site.homeTitle,
    description: site.homeDescription,
    path: "/",
  }),
  // HOME 은 title.template 을 적용하지 않는다.
  title: { absolute: site.homeTitle },
};

/**
 * HOME
 * 한 번 스크롤하면 PAST → PRESENT → FUTURE 가 이해되도록 배치했다.
 *
 * 1 HERO
 * 2 PAST — WHERE I STARTED
 * 3 PRESENT — WHERE I AM
 * 4 CURRENT ECOSYSTEM
 * 5 FUTURE — WHAT I AM BUILDING
 * 6 FEATURED STORY
 * 7 BOOKS & PUBLICATIONS
 * 8 PROJECTS
 * 9 WRITING & MEDIA
 * 10 FOLLOW KO A RA
 * 11 ABOUT / CONTACT CTA
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <PastSection />
      <PresentSection />
      <EcosystemSection />
      <FutureSection />
      <FeaturedStorySection />
      <BooksSection />
      <ProjectsSection />
      <MediaSection />
      <FollowSection />
      <AboutCtaSection />
    </>
  );
}
