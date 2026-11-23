import type { ReactNode } from "react";

type Width = "default" | "narrow" | "wide";

const widths: Record<Width, string> = {
  narrow: "max-w-3xl",
  default: "max-w-5xl",
  wide: "max-w-6xl",
};

export function Container({
  children,
  width = "default",
  className = "",
}: {
  children: ReactNode;
  width?: Width;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto w-full ${widths[width]} px-5 sm:px-6 lg:px-8 ${className}`}
    >
      {children}
    </div>
  );
}
