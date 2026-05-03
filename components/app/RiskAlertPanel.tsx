import { AlertTriangle, Clock } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface RiskTask {
  id: string;
  title: string;
  dueDate: Date | null;
  fruitId: string;
  fruit: { name: string; emoji: string | null };
}

interface RiskAlertPanelProps {
  tasks: RiskTask[];
  className?: string;
}

export default function RiskAlertPanel({ tasks, className }: RiskAlertPanelProps) {
  if (tasks.length === 0) return null;

  return (
    <div className={cn("bg-red-50 border border-red-200 rounded-xl p-6", className)}>
      <h2 className="font-semibold text-red-700 flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5" />
        일정 지연 리스크 ({tasks.length}건) — 즉시 확인 필요
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tasks.map((t) => (
          <Link
            key={t.id}
            href={`/app/fruits/${t.fruitId}`}
            className="flex items-start gap-3 bg-white rounded-lg p-3 border border-red-100 hover:border-red-300 transition-colors group"
          >
            <span className="text-lg mt-0.5">{t.fruit.emoji ?? "🍓"}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate group-hover:text-brand transition-colors">
                {t.title}
              </p>
              <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(t.dueDate)} 마감 지남
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{t.fruit.name}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
