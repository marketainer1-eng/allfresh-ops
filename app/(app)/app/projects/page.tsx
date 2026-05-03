import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, FolderOpen } from "lucide-react";
import { STATUS_COLORS, STATUS_LABELS, formatDate } from "@/lib/utils";

export default async function ProjectsPage() {
  const session = await auth();
  const workspaceId = (session?.user as any)?.workspaceId;

  const projects = await prisma.project.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    include: {
      organization: { select: { name: true } },
      _count: { select: { sessions: true } },
    },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">프로젝트</h1>
          <p className="text-gray-500 text-sm mt-1">총 {projects.length}개 프로젝트</p>
        </div>
        <Link
          href="/app/projects/new"
          className="inline-flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          새 프로젝트
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">프로젝트가 없습니다</h3>
          <p className="text-gray-500 text-sm mb-6">첫 번째 고객경험 진단 프로젝트를 만들어보세요.</p>
          <Link
            href="/app/projects/new"
            className="inline-flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            첫 프로젝트 만들기
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/app/projects/${p.id}`}
              className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-brand-muted rounded-lg flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="w-5 h-5 text-brand" />
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {STATUS_LABELS[p.status] ?? p.status}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-brand transition-colors mb-1 line-clamp-1">
                {p.name}
              </h3>
              <p className="text-sm text-gray-500 mb-3">{p.brand}</p>
              {p.description && (
                <p className="text-xs text-gray-400 line-clamp-2 mb-3">{p.description}</p>
              )}
              {p.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {p.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50">
                <span>세션 {p._count.sessions}개</span>
                <span>{formatDate(p.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
