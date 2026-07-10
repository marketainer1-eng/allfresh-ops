import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "wouter";

const navItems = [
  { label: "About", href: "/about" },
  { label: "Vision", href: "/vision" },
  { label: "경영진", href: "/leadership" },
  { label: "조직도", href: "/organization" },
  { label: "연혁", href: "/history" },
  { label: "사업영역", href: "/business" },
  { label: "프로그램", href: "/program" },
  { label: "협력사", href: "/partners" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const isHome = location === "/";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || !isHome
          ? "bg-[#102741]/95 backdrop-blur-md border-b border-[#12CAE2]/10"
          : "bg-transparent"
      }`}
    >
      <div className="container flex items-center justify-between h-14 sm:h-16">
        <Link href="/" className="flex items-center">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663464106640/D6BuPYrTgDqGCDqQNMTGKJ/kaia-logo-transparent_286ae696.png"
            alt="KAIA AI에이전트협회"
            className="h-8 sm:h-10 w-auto object-contain"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                location === item.href
                  ? "text-[#12CAE2]"
                  : "text-[#4ADE80] hover:text-[#12CAE2]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Toggle */}
        <button
          className="lg:hidden text-[#E6F9FF] p-2 -mr-2 touch-manipulation"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "메뉴 닫기" : "메뉴 열기"}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav - Full screen overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-14 sm:top-16 bg-[#0A1829]/98 backdrop-blur-lg z-40">
          <nav className="container py-6 flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-3.5rem)]">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-base font-medium transition-colors py-3 px-4 rounded-lg touch-manipulation ${
                  location === item.href
                    ? "text-[#12CAE2] bg-[#12CAE2]/10"
                    : "text-[#E6F9FF]/80 hover:text-[#12CAE2] hover:bg-[#12CAE2]/5 active:bg-[#12CAE2]/10"
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
