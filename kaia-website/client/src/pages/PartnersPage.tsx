import Header from "@/components/Header";
import PartnersSection from "@/components/PartnersSection";
import Footer from "@/components/Footer";

export default function PartnersPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-16">
        <PartnersSection />
      </div>
      <Footer />
    </div>
  );
}
