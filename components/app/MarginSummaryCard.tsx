import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { formatKRW, formatPct } from "@/lib/fruit-utils";
import { cn } from "@/lib/utils";

interface MarginSummaryCardProps {
  salesAmount: number;
  marginAmount: number;
  marginRate: number;
  conversionRate?: number;
  returnRate?: number;
  csCount?: number;
  channel?: string;
  className?: string;
}

export default function MarginSummaryCard({
  salesAmount,
  marginAmount,
  marginRate,
  conversionRate,
  returnRate,
  csCount,
  channel,
  className,
}: MarginSummaryCardProps) {
  const isGoodMargin = marginRate >= 20;
  const isHighReturn = (returnRate ?? 0) > 5;

  return (
    <div className={cn("bg-white rounded-xl border border-gray-100 p-5", className)}>
      {channel && (
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          {channel}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-400">매출</p>
          <p className="text-lg font-bold text-gray-900">{formatKRW(salesAmount)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">마진</p>
          <p className="text-lg font-bold text-gray-900">{formatKRW(marginAmount)}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-lg",
            isGoodMargin ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
          )}
        >
          {isGoodMargin ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : (
            <BarChart3 className="w-3.5 h-3.5" />
          )}
          마진 {formatPct(marginRate)}
        </div>

        {conversionRate !== undefined && (
          <div className="text-xs text-gray-500">
            전환 <span className="font-medium text-gray-800">{formatPct(conversionRate)}</span>
          </div>
        )}

        {returnRate !== undefined && (
          <div className={cn("text-xs", isHighReturn ? "text-red-500 font-medium" : "text-gray-500")}>
            반품 <span>{formatPct(returnRate)}</span>
          </div>
        )}

        {csCount !== undefined && (
          <div className="text-xs text-gray-400">
            CS {csCount}건
          </div>
        )}
      </div>
    </div>
  );
}
