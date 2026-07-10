import Header from "@/components/Header";
import HistorySection from "@/components/HistorySection";
import NextSectionLink from "@/components/NextSectionLink";
import Footer from "@/components/Footer";

export default function HistoryPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-16">
        <HistorySection />
        <NextSectionLink href="/business" label="사업영역 바로가기" />
      </div>
      <Footer />
    </div>
  );
}
