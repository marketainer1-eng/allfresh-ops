import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const updateSchema = z.object({
  channel: z.string().min(1).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  keyPoints: z.array(z.string()).optional(),
  hashtags: z.array(z.string()).optional(),
  status: z.string().optional(),
});

// PATCH /api/marketing/content-plans/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.contentPlan.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
  });
  if (!existing) return apiError("콘텐츠 기획안을 찾을 수 없습니다.", 404);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 본문입니다.");
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);
  const d = parsed.data;

  const updated = await prisma.contentPlan.update({
    where: { id },
    data: {
      ...(d.channel !== undefined ? { channel: d.channel } : {}),
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.description !== undefined ? { description: d.description } : {}),
      ...(d.keyPoints !== undefined ? { keyPoints: d.keyPoints } : {}),
      ...(d.hashtags !== undefined ? { hashtags: d.hashtags } : {}),
      ...(d.status !== undefined ? { status: d.status } : {}),
    },
    include: { executionTasks: { orderBy: { recommendedDate: "asc" } } },
  });
  return apiResponse(updated);
}

// DELETE /api/marketing/content-plans/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.contentPlan.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
  });
  if (!existing) return apiError("콘텐츠 기획안을 찾을 수 없습니다.", 404);

  // 연결된 실행 작업의 링크를 끊고 기획안 삭제(작업 자체는 유지)
  await prisma.executionTask.updateMany({
    where: { contentPlanId: id, workspaceId: ctx.workspaceId },
    data: { contentPlanId: null },
  });
  await prisma.contentPlan.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
