import Header from "@/components/Header";
import ProgramSection from "@/components/ProgramSection";
import BenefitsSection from "@/components/BenefitsSection";
import AudienceSection from "@/components/AudienceSection";
import WhyKaiaSection from "@/components/WhyKaiaSection";
import Footer from "@/components/Footer";

export default function ProgramPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-16">
        <ProgramSection />
        <BenefitsSection />
        <AudienceSection />
        <WhyKaiaSection />
      </div>
      <Footer />
    </div>
  );
}
