import { PHASE_LABELS, PHASE_COLORS, type FruitPhase } from "@/lib/fruit-utils";
import { cn } from "@/lib/utils";

interface FruitStatusBadgeProps {
  phase: FruitPhase;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function FruitStatusBadge({
  phase,
  size = "md",
  className,
}: FruitStatusBadgeProps) {
  const sizeClass = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-xs px-2 py-1",
    lg: "text-sm px-3 py-1.5",
  }[size];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        sizeClass,
        PHASE_COLORS[phase],
        className
      )}
    >
      {PHASE_LABELS[phase]}
    </span>
  );
}
