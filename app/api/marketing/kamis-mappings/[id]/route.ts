import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const updateSchema = z.object({
  productName: z.string().min(1).optional(),
  categoryCode: z.string().min(1).optional(),
  categoryName: z.string().optional(),
  itemCode: z.string().min(1).optional(),
  itemName: z.string().optional(),
  kindCode: z.string().optional(),
  kindName: z.string().optional(),
  rankCode: z.string().optional(),
  isActive: z.boolean().optional(),
  analysisId: z.string().optional().nullable(),
});

// PATCH /api/marketing/kamis-mappings/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.kamisMapping.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
  });
  if (!existing) return apiError("매핑을 찾을 수 없습니다.", 404);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 본문입니다.");
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const d = parsed.data;
  const updated = await prisma.kamisMapping.update({
    where: { id },
    data: {
      ...d,
      analysisId: d.analysisId ?? undefined,
    },
  });
  return apiResponse(updated);
}

// DELETE /api/marketing/kamis-mappings/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.kamisMapping.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
  });
  if (!existing) return apiError("매핑을 찾을 수 없습니다.", 404);

  await prisma.kamisMapping.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
