import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  season: z.enum(["spring", "summer", "autumn", "winter"]).optional(),
  sourcingStartDate: z.string().optional().transform((v) => v ? new Date(v) : undefined),
  pricingDueDate: z.string().optional().transform((v) => v ? new Date(v) : undefined),
  contentDueDate: z.string().optional().transform((v) => v ? new Date(v) : undefined),
  launchDate: z.string().optional().transform((v) => v ? new Date(v) : undefined),
  promoPeakStartDate: z.string().optional().transform((v) => v ? new Date(v) : undefined),
  promoPeakEndDate: z.string().optional().transform((v) => v ? new Date(v) : undefined),
  reviewDate: z.string().optional().transform((v) => v ? new Date(v) : undefined),
  status: z.enum(["draft", "planned", "active", "completed", "delayed"]).optional(),
  notes: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { ctx, error } = await requireSession();
  if (error) return error;
  const { campaignId } = await params;

  const campaign = await prisma.fruitCampaign.findFirst({
    where: { id: campaignId, workspaceId: ctx.workspaceId },
    include: {
      fruit: true,
      tasks: { orderBy: { dueDate: "asc" } },
      performances: true,
      insights: { orderBy: { sourceYear: "desc" } },
    },
  });

  if (!campaign) return apiError("캠페인을 찾을 수 없습니다.", 404);
  return apiResponse(campaign);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { ctx, error } = await requireSession();
  if (error) return error;
  const { campaignId } = await params;

  const existing = await prisma.fruitCampaign.findFirst({
    where: { id: campaignId, workspaceId: ctx.workspaceId },
  });
  if (!existing) return apiError("캠페인을 찾을 수 없습니다.", 404);

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const updated = await prisma.fruitCampaign.update({
    where: { id: campaignId },
    data: parsed.data,
  });

  return apiResponse(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { ctx, error } = await requireSession();
  if (error) return error;
  const { campaignId } = await params;

  const existing = await prisma.fruitCampaign.findFirst({
    where: { id: campaignId, workspaceId: ctx.workspaceId },
  });
  if (!existing) return apiError("캠페인을 찾을 수 없습니다.", 404);

  await prisma.fruitCampaign.delete({ where: { id: campaignId } });
  return new Response(null, { status: 204 });
}
