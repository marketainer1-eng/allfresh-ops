import Header from "@/components/Header";
import ChairmanProfileSection from "@/components/ChairmanProfileSection";
import CooProfileSection from "@/components/CooProfileSection";
import NextSectionLink from "@/components/NextSectionLink";
import Footer from "@/components/Footer";

export default function LeadershipPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-16">
        <ChairmanProfileSection />
        <CooProfileSection />
        <NextSectionLink href="/organization" label="조직도 바로가기" />
      </div>
      <Footer />
    </div>
  );
}
