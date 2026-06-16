import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const updateSchema = z.object({
  isSelected: z.boolean().optional(),
  assignee: z.string().optional(),
  content: z.string().min(1).optional(),
});

// PATCH /api/marketing/strategy-items/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.strategyItem.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
  });
  if (!existing) return apiError("전략 항목을 찾을 수 없습니다.", 404);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 본문입니다.");
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const updated = await prisma.strategyItem.update({
    where: { id },
    data: parsed.data,
  });
  return apiResponse(updated);
}

// DELETE /api/marketing/strategy-items/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.strategyItem.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
  });
  if (!existing) return apiError("전략 항목을 찾을 수 없습니다.", 404);

  await prisma.strategyItem.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
