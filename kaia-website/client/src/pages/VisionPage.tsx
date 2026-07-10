import Header from "@/components/Header";
import VisionSection from "@/components/VisionSection";
import Footer from "@/components/Footer";

export default function VisionPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-16">
        <VisionSection />
      </div>
      <Footer />
    </div>
  );
}
