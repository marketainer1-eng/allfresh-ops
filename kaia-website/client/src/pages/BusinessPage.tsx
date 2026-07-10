import Header from "@/components/Header";
import BusinessSection from "@/components/BusinessSection";
import Footer from "@/components/Footer";

export default function BusinessPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-16">
        <BusinessSection />
      </div>
      <Footer />
    </div>
  );
}
