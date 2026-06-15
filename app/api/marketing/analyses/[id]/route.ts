import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const updateSchema = z.object({
  productName: z.string().min(1).optional(),
  category: z.enum(["single", "giftset", "subscription"]).optional(),
  productInfo: z.string().optional(),
  attributes: z.record(z.any()).optional(),
  targetCustomer: z.string().optional(),
  marketingCopy: z.string().optional(),
  seoKeywords: z.array(z.string()).optional(),
  seasonalCampaign: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  pricePositioning: z.string().optional(),
  differentiation: z.string().optional(),
  recommendedChannels: z
    .array(
      z.object({
        channel: z.string(),
        priority: z.string(),
        reasoning: z.string(),
      }),
    )
    .optional(),
  thumbnailUrl: z.string().optional(),
  status: z.string().optional(),
});

// GET /api/marketing/analyses/:id  — 분석 단건 + 하위 항목 포함
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const analysis = await prisma.analysis.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
    include: {
      strategyItems: { orderBy: { createdAt: "asc" } },
      contentPlans: { orderBy: { createdAt: "asc" } },
      executionTasks: { orderBy: { recommendedDate: "asc" } },
      _count: { select: { strategyItems: true, contentPlans: true } },
    },
  });

  if (!analysis) return apiError("분석을 찾을 수 없습니다.", 404);
  return apiResponse(analysis);
}

// PATCH /api/marketing/analyses/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.analysis.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
  });
  if (!existing) return apiError("분석을 찾을 수 없습니다.", 404);

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const updated = await prisma.analysis.update({
    where: { id },
    data: parsed.data,
  });
  return apiResponse(updated);
}

// DELETE /api/marketing/analyses/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.analysis.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
  });
  if (!existing) return apiError("분석을 찾을 수 없습니다.", 404);

  await prisma.analysis.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
