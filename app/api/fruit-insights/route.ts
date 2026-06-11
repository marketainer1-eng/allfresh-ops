import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const createSchema = z.object({
  fruitId: z.string().min(1),
  campaignId: z.string().optional(),
  sourceYear: z.number().int(),
  summary: z.string().min(1),
  recommendation: z.string().min(1),
  linkedToNextCampaign: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  const { ctx, error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const fruitId = searchParams.get("fruitId");
  const linked = searchParams.get("linked");

  const insights = await prisma.fruitInsight.findMany({
    where: {
      workspaceId: ctx.workspaceId,
      ...(fruitId ? { fruitId } : {}),
      ...(linked === "true" ? { linkedToNextCampaign: true } : {}),
    },
    orderBy: { sourceYear: "desc" },
    include: {
      fruit: { select: { id: true, name: true, emoji: true } },
      campaign: { select: { id: true, title: true, year: true } },
    },
  });

  return apiResponse(insights);
}

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireSession();
  if (error) return error;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const insight = await prisma.fruitInsight.create({
    data: { ...parsed.data, workspaceId: ctx.workspaceId },
    include: { fruit: { select: { name: true } } },
  });

  return apiResponse(insight, 201);
}
