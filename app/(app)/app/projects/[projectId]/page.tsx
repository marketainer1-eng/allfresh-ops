import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, FileSearch, Calendar, Tag } from "lucide-react";
import { STATUS_COLORS, STATUS_LABELS, formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const { projectId } = await params;
  const session = await auth();
  const workspaceId = (session?.user as any)?.workspaceId;

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId },
    include: {
      organization: true,
      sessions: {
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { symptoms: true, bottlenecks: true, ticketDrafts: true } },
        },
      },
    },
  });

  if (!project) notFound();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/app/projects"
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{project.name}</h1>
            <span
              className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${
                STATUS_COLORS[project.status] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {STATUS_LABELS[project.status] ?? project.status}
            </span>
          </div>
          {project.brand && <p className="text-gray-500 text-sm mt-0.5">{project.brand}</p>}
        </div>
        <Link
          href={`/app/projects/${project.id}/diagnosis/new`}
          className="flex-shrink-0 inline-flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          새 진단 세션
        </Link>
      </div>

      {/* Project Info */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 grid md:grid-cols-3 gap-6">
        {project.description && (
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500 font-medium mb-1">프로젝트 설명</p>
            <p className="text-gray-700 text-sm leading-relaxed">{project.description}</p>
          </div>
        )}
        <div className="space-y-3">
          {project.tags.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3" /> 태그
              </p>
              <div className="flex flex-wrap gap-1">
                {project.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> 생성일
            </p>
            <p className="text-sm text-gray-700 mt-0.5">{formatDate(project.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Sessions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">진단 세션</h2>
          <span className="text-sm text-gray-400">{project.sessions.length}개</span>
        </div>

        {project.sessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
            <FileSearch className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">진단 세션이 없습니다</h3>
            <p className="text-gray-500 text-sm mb-6">첫 진단 세션을 만들어 고객 증상을 수집하세요.</p>
            <Link
              href={`/app/projects/${project.id}/diagnosis/new`}
              className="inline-flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-dark transition-colors"
            >
              <Plus className="w-4 h-4" />
              진단 세션 만들기
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {project.sessions.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          STATUS_COLORS[s.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {STATUS_LABELS[s.status] ?? s.status}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900 truncate">{s.title}</h3>
                    {s.objective && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{s.objective}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right text-xs text-gray-400 space-y-1">
                    <p>증상 {s._count.symptoms}</p>
                    <p>병목 {s._count.bottlenecks}</p>
                    <p>티켓 {s._count.ticketDrafts}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Link
                    href={`/app/diagnosis/${s.id}/flow`}
                    className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    고객여정
                  </Link>
                  <Link
                    href={`/app/diagnosis/${s.id}/symptoms`}
                    className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    증상 수집
                  </Link>
                  <Link
                    href={`/app/diagnosis/${s.id}/analysis`}
                    className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    병목 분석
                  </Link>
                  <Link
                    href={`/app/projects/${project.id}/tickets`}
                    className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    티켓
                  </Link>
                  <Link
                    href={`/app/projects/${project.id}/rechecks`}
                    className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    재점검
                  </Link>
                  <Link
                    href={`/app/projects/${project.id}/reports`}
                    className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    리포트
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
