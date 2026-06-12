// app/api/performance-analyses/[id]/route.ts
// 저장된 성과분석 단건 조회(GET) / 삭제(DELETE). 워크스페이스 격리.

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { apiError, apiResponse } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, error } = await requireSession();
  if (error) return error;
  const { id } = await params;
  const item = await prisma.performanceAnalysis.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
  });
  if (!item) return apiError("해당 분석을 찾을 수 없습니다.", 404);
  return apiResponse(item);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, error } = await requireSession();
  if (error) return error;
  const { id } = await params;
  const found = await prisma.performanceAnalysis.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
    select: { id: true },
  });
  if (!found) return apiError("해당 분석을 찾을 수 없습니다.", 404);
  await prisma.performanceAnalysis.delete({ where: { id } });
  return apiResponse({ ok: true });
}
