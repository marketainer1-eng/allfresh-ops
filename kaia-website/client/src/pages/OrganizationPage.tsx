import Header from "@/components/Header";
import OrgChartSection from "@/components/OrgChartSection";
import NextSectionLink from "@/components/NextSectionLink";
import Footer from "@/components/Footer";

export default function OrganizationPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-16">
        <OrgChartSection />
        <NextSectionLink href="/history" label="연혁 바로가기" />
      </div>
      <Footer />
    </div>
  );
}
