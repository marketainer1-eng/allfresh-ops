import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const createSchema = z.object({
  fruitId: z.string().min(1),
  campaignId: z.string().optional(),
  channel: z.string().min(1),
  salesAmount: z.number().default(0),
  marginAmount: z.number().default(0),
  marginRate: z.number().default(0),
  csCount: z.number().int().default(0),
  returnRate: z.number().default(0),
  conversionRate: z.number().default(0),
  reviewSummary: z.string().optional(),
  nextAction: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { ctx, error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const fruitId = searchParams.get("fruitId");
  const campaignId = searchParams.get("campaignId");
  const channel = searchParams.get("channel");

  const performances = await prisma.fruitPerformance.findMany({
    where: {
      workspaceId: ctx.workspaceId,
      ...(fruitId ? { fruitId } : {}),
      ...(campaignId ? { campaignId } : {}),
      ...(channel ? { channel } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      fruit: { select: { id: true, name: true, emoji: true } },
      campaign: { select: { id: true, title: true, year: true, season: true } },
    },
  });

  return apiResponse(performances);
}

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireSession();
  if (error) return error;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const perf = await prisma.fruitPerformance.create({
    data: { ...parsed.data, workspaceId: ctx.workspaceId },
    include: { fruit: { select: { name: true } } },
  });

  return apiResponse(perf, 201);
}
