import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const updateSchema = z.object({
  type: z.enum(["sourcing", "pricing", "content", "sales", "review"]).optional(),
  title: z.string().min(1).optional(),
  dueDate: z.string().optional().transform((v) => v ? new Date(v) : undefined),
  status: z.enum(["pending", "in_progress", "done", "delayed"]).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  notes: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { ctx, error } = await requireSession(req);
  if (error) return error;
  const { taskId } = await params;

  const task = await prisma.fruitTask.findFirst({
    where: { id: taskId, workspaceId: ctx.workspaceId },
    include: {
      fruit: { select: { id: true, name: true, emoji: true } },
      campaign: { select: { id: true, title: true, year: true } },
    },
  });

  if (!task) return apiError("태스크를 찾을 수 없습니다.", 404);
  return apiResponse(task);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { ctx, error } = await requireSession(req);
  if (error) return error;
  const { taskId } = await params;

  const existing = await prisma.fruitTask.findFirst({
    where: { id: taskId, workspaceId: ctx.workspaceId },
  });
  if (!existing) return apiError("태스크를 찾을 수 없습니다.", 404);

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const updated = await prisma.fruitTask.update({
    where: { id: taskId },
    data: parsed.data,
  });

  return apiResponse(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { ctx, error } = await requireSession(req);
  if (error) return error;
  const { taskId } = await params;

  const existing = await prisma.fruitTask.findFirst({
    where: { id: taskId, workspaceId: ctx.workspaceId },
  });
  if (!existing) return apiError("태스크를 찾을 수 없습니다.", 404);

  await prisma.fruitTask.delete({ where: { id: taskId } });
  return new Response(null, { status: 204 });
}
