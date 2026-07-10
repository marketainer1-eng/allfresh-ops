import Header from "@/components/Header";
import AboutSection from "@/components/AboutSection";
import RoleSection from "@/components/RoleSection";
import NextSectionLink from "@/components/NextSectionLink";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-16">
        <AboutSection />
        <RoleSection />
        <NextSectionLink href="/leadership" label="경영진 소개 바로가기" />
      </div>
      <Footer />
    </div>
  );
}
