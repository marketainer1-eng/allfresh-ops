import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const updateSchema = z.object({
  assignee: z.string().optional(),
  status: z.enum(["pending", "in_progress", "done"]).optional(),
  recommendedDate: z.string().optional(),
});

// PATCH /api/marketing/execution-tasks/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.executionTask.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
  });
  if (!existing) return apiError("실행 작업을 찾을 수 없습니다.", 404);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 본문입니다.");
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const { assignee, status, recommendedDate } = parsed.data;
  const data: {
    assignee?: string;
    status?: string;
    recommendedDate?: Date;
  } = {};
  if (assignee !== undefined) data.assignee = assignee;
  if (status !== undefined) data.status = status;
  if (recommendedDate !== undefined) {
    const d = new Date(recommendedDate);
    if (isNaN(d.getTime())) return apiError("유효하지 않은 날짜입니다.");
    data.recommendedDate = d;
  }

  const updated = await prisma.executionTask.update({
    where: { id },
    data,
  });
  return apiResponse(updated);
}

// DELETE /api/marketing/execution-tasks/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.executionTask.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
  });
  if (!existing) return apiError("실행 작업을 찾을 수 없습니다.", 404);

  await prisma.executionTask.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
