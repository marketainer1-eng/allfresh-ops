import { CheckCircle2 } from "lucide-react";
import { PHASE_BAR_COLORS, type FruitPhase } from "@/lib/fruit-utils";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Milestone {
  label: string;
  date: Date | null;
}

interface CampaignTimelineProps {
  milestones: Milestone[];
  phase: FruitPhase;
  className?: string;
}

const PHASE_PROGRESS: Record<FruitPhase, number> = {
  upcoming:   5,
  preparing:  15,
  sourcing:   30,
  marketing:  50,
  in_season:  65,
  peak:       80,
  closing:    90,
  completed:  100,
  delayed:    40,
};

export default function CampaignTimeline({
  milestones,
  phase,
  className,
}: CampaignTimelineProps) {
  const now = new Date();
  const progress = PHASE_PROGRESS[phase] ?? 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* 진행 바 */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", PHASE_BAR_COLORS[phase])}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 마일스톤 리스트 */}
      <div className="relative">
        <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-100" />
        <div className="space-y-4">
          {milestones
            .filter((m) => m.date)
            .map((m, i) => {
              const isPast = m.date && new Date(m.date) < now;
              return (
                <div key={m.label} className="flex items-center gap-4 pl-8 relative">
                  <div
                    className={cn(
                      "absolute left-0 w-7 h-7 rounded-full border-2 flex items-center justify-center",
                      isPast
                        ? "border-green-500 bg-green-500"
                        : "border-gray-300 bg-white"
                    )}
                  >
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-xs text-gray-400">{i + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isPast ? "text-green-700" : "text-gray-700"
                      )}
                    >
                      {m.label}
                    </span>
                    <span
                      className={cn(
                        "text-sm",
                        isPast ? "text-green-600" : "text-gray-500"
                      )}
                    >
                      {formatDate(m.date)}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
