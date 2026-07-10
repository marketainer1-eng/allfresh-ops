import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

interface NextSectionLinkProps {
  href: string;
  label: string;
}

export default function NextSectionLink({ href, label }: NextSectionLinkProps) {
  return (
    <div className="flex justify-center py-12 bg-[#0A1929]">
      <Link
        href={href}
        className="group flex items-center gap-3 px-8 py-4 border border-[#12CAE2]/30 rounded-lg text-[#12CAE2] hover:bg-[#12CAE2]/10 hover:border-[#12CAE2]/60 transition-all duration-300"
      >
        <span className="text-sm font-medium">{label}</span>
        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
