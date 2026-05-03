import { CheckCircle2, Lightbulb } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface InsightData {
  id: string;
  sourceYear: number;
  summary: string;
  recommendation: string;
  linkedToNextCampaign: boolean;
  fruit: { id: string; name: string; emoji: string | null };
}

interface NextSeasonInsightCardProps {
  insight: InsightData;
  className?: string;
}

export default function NextSeasonInsightCard({
  insight,
  className,
}: NextSeasonInsightCardProps) {
  return (
    <Link
      href={`/app/fruits/${insight.fruit.id}`}
      className={cn(
        "block bg-white rounded-xl border p-4 hover:border-green-300 hover:shadow-sm transition-all",
        insight.linkedToNextCampaign ? "border-green-200" : "border-gray-100",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{insight.fruit.emoji ?? "🍓"}</span>
        <span className="text-sm font-medium text-gray-900">{insight.fruit.name}</span>
        <span className="text-xs text-gray-400">{insight.sourceYear}년 기반</span>
        {insight.linkedToNextCampaign && (
          <span className="ml-auto text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 적용됨
          </span>
        )}
      </div>
      <div className="flex items-start gap-1.5 mb-2">
        <Lightbulb className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
          {insight.recommendation}
        </p>
      </div>
    </Link>
  );
}
