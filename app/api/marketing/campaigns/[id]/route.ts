import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const isoDate = z
  .string()
  .min(1)
  .refine((s) => !isNaN(new Date(s).getTime()), {
    message: "유효한 날짜(ISO)를 입력하세요.",
  });

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
  status: z.enum(["planned", "active", "completed"]).optional(),
  color: z.string().nullable().optional(),
  channel: z.string().nullable().optional(),
  assignee: z.string().nullable().optional(),
  analysisId: z.string().nullable().optional(),
});

// GET /api/marketing/campaigns/:id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const campaign = await prisma.marketingCampaign.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
  });
  if (!campaign) return apiError("캠페인을 찾을 수 없습니다.", 404);
  return apiResponse(campaign);
}

// PATCH /api/marketing/campaigns/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.marketingCampaign.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
  });
  if (!existing) return apiError("캠페인을 찾을 수 없습니다.", 404);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 본문입니다.");
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const d = parsed.data;
  const updated = await prisma.marketingCampaign.update({
    where: { id },
    data: {
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.description !== undefined ? { description: d.description } : {}),
      ...(d.category !== undefined ? { category: d.category } : {}),
      ...(d.startDate !== undefined ? { startDate: new Date(d.startDate) } : {}),
      ...(d.endDate !== undefined ? { endDate: new Date(d.endDate) } : {}),
      ...(d.status !== undefined ? { status: d.status } : {}),
      ...(d.color !== undefined ? { color: d.color } : {}),
      ...(d.channel !== undefined ? { channel: d.channel } : {}),
      ...(d.assignee !== undefined ? { assignee: d.assignee } : {}),
      ...(d.analysisId !== undefined ? { analysisId: d.analysisId } : {}),
    },
  });
  return apiResponse(updated);
}

// DELETE /api/marketing/campaigns/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.marketingCampaign.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
  });
  if (!existing) return apiError("캠페인을 찾을 수 없습니다.", 404);

  await prisma.marketingCampaign.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
