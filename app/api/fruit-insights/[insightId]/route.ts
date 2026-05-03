import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const updateSchema = z.object({
  sourceYear: z.number().int().optional(),
  summary: z.string().min(1).optional(),
  recommendation: z.string().min(1).optional(),
  linkedToNextCampaign: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ insightId: string }> }
) {
  const { ctx, error } = await requireSession(req);
  if (error) return error;
  const { insightId } = await params;

  const insight = await prisma.fruitInsight.findFirst({
    where: { id: insightId, workspaceId: ctx.workspaceId },
    include: {
      fruit: { select: { id: true, name: true, emoji: true } },
      campaign: { select: { id: true, title: true, year: true } },
    },
  });

  if (!insight) return apiError("인사이트를 찾을 수 없습니다.", 404);
  return apiResponse(insight);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ insightId: string }> }
) {
  const { ctx, error } = await requireSession(req);
  if (error) return error;
  const { insightId } = await params;

  const existing = await prisma.fruitInsight.findFirst({
    where: { id: insightId, workspaceId: ctx.workspaceId },
  });
  if (!existing) return apiError("인사이트를 찾을 수 없습니다.", 404);

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const updated = await prisma.fruitInsight.update({
    where: { id: insightId },
    data: parsed.data,
    include: {
      fruit: { select: { name: true, emoji: true } },
    },
  });

  return apiResponse(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ insightId: string }> }
) {
  const { ctx, error } = await requireSession(req);
  if (error) return error;
  const { insightId } = await params;

  const existing = await prisma.fruitInsight.findFirst({
    where: { id: insightId, workspaceId: ctx.workspaceId },
  });
  if (!existing) return apiError("인사이트를 찾을 수 없습니다.", 404);

  await prisma.fruitInsight.delete({ where: { id: insightId } });
  return new Response(null, { status: 204 });
}
