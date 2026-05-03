import { PHASE_BAR_COLORS, type FruitPhase } from "@/lib/fruit-utils";
import { cn } from "@/lib/utils";

interface FruitCalendarBarProps {
  seasonStartMonth: number;
  seasonEndMonth: number;
  peakStartMonth: number;
  peakEndMonth: number;
  phase: FruitPhase;
  currentMonth?: number;
  showLabels?: boolean;
  className?: string;
}

/**
 * 과일 캘린더 바 컴포넌트
 * 연중 12개월 구간에서 제철(연두)·피크(초록)·현재 위치(마커)를 표시합니다.
 */
export default function FruitCalendarBar({
  seasonStartMonth,
  seasonEndMonth,
  peakStartMonth,
  peakEndMonth,
  phase,
  currentMonth,
  showLabels = false,
  className,
}: FruitCalendarBarProps) {
  const now = currentMonth ?? new Date().getMonth() + 1; // 1-12

  function calcBar(
    start: number,
    end: number
  ): { left: string; width: string } {
    const s = start <= end ? start : start;
    const span = start <= end ? end - start + 1 : 12 - start + 1 + end;
    const left = ((s - 1) / 12) * 100;
    const width = (span / 12) * 100;
    return {
      left: `${left.toFixed(1)}%`,
      width: `${Math.min(width, 100 - left).toFixed(1)}%`,
    };
  }

  const seasonBar = calcBar(seasonStartMonth, seasonEndMonth);
  const peakBar = calcBar(peakStartMonth, peakEndMonth);
  const markerLeft = (((now - 1) / 12) * 100).toFixed(1);

  return (
    <div className={cn("w-full", className)}>
      {showLabels && (
        <div className="flex justify-between text-xs text-gray-300 mb-1">
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i + 1}>{i + 1}</span>
          ))}
        </div>
      )}
      <div className="h-2 bg-gray-100 rounded-full relative overflow-visible">
        {/* 제철 바 */}
        <div
          className="absolute h-full bg-green-200 rounded-full"
          style={{ left: seasonBar.left, width: seasonBar.width }}
        />
        {/* 피크 바 */}
        <div
          className={cn("absolute h-full rounded-full", PHASE_BAR_COLORS[phase] ?? "bg-green-500")}
          style={{ left: peakBar.left, width: peakBar.width }}
        />
        {/* 현재 월 마커 */}
        <div
          className="absolute h-full w-0.5 bg-gray-700 z-10"
          style={{ left: `${markerLeft}%` }}
          title={`현재: ${now}월`}
        />
      </div>
    </div>
  );
}
