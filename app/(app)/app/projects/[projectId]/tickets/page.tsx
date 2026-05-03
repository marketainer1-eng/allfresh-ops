import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Ticket } from "lucide-react";
import { PRIORITY_COLORS, PRIORITY_LABELS, STATUS_COLORS, STATUS_LABELS, formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function TicketsPage({ params }: Props) {
  const { projectId } = await params;
  const session = await auth();
  const workspaceId = (session?.user as any)?.workspaceId;

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId },
  });
  if (!project) notFound();

  const tickets = await prisma.ticketDraft.findMany({
    where: { session: { projectId: project.id } },
    orderBy: { createdAt: "desc" },
    include: {
      session: { select: { title: true } },
      bottleneck: { select: { label: true, journeyStep: true } },
      _count: { select: { rechecks: true } },
    },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/app/projects/${project.id}`}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">개선 티켓</h1>
          <p className="text-gray-500 text-sm mt-0.5">{project.name}</p>
        </div>
        <span className="text-sm text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
          총 {tickets.length}개
        </span>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">티켓이 없습니다</h3>
          <p className="text-gray-500 text-sm">
            병목 분석 후 "개선 티켓 생성" 버튼을 눌러주세요.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        PRIORITY_COLORS[t.priority] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {PRIORITY_LABELS[t.priority] ?? t.priority}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        STATUS_COLORS[t.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {STATUS_LABELS[t.status] ?? t.status}
                    </span>
                    <span className="text-xs text-gray-400">{t.type}</span>
                  </div>
                  <h3 className="font-medium text-gray-900">{t.title}</h3>
                  {t.hypothesis && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.hypothesis}</p>
                  )}
                  {t.bottleneck && (
                    <p className="text-xs text-gray-400 mt-1">
                      병목: {t.bottleneck.label}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right text-xs text-gray-400 space-y-1">
                  <p>{formatDate(t.createdAt)}</p>
                  <p>재점검 {t._count.rechecks}회</p>
                </div>
              </div>
              {t.proposedAction && (
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <p className="text-xs text-gray-500">
                    <span className="font-medium text-gray-700">제안 액션: </span>
                    {t.proposedAction}
                  </p>
                </div>
              )}
              {t.successMetric && (
                <p className="text-xs text-gray-400 mt-1">
                  <span className="font-medium">성공 지표: </span>{t.successMetric}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
