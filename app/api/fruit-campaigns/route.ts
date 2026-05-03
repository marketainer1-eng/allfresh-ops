import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const createSchema = z.object({
  fruitId: z.string().min(1),
  year: z.number().int(),
  season: z.enum(["spring", "summer", "autumn", "winter"]),
  title: z.string().min(1),
  sourcingStartDate: z.string().optional().transform((v) => v ? new Date(v) : undefined),
  pricingDueDate: z.string().optional().transform((v) => v ? new Date(v) : undefined),
  contentDueDate: z.string().optional().transform((v) => v ? new Date(v) : undefined),
  launchDate: z.string().optional().transform((v) => v ? new Date(v) : undefined),
  promoPeakStartDate: z.string().optional().transform((v) => v ? new Date(v) : undefined),
  promoPeakEndDate: z.string().optional().transform((v) => v ? new Date(v) : undefined),
  reviewDate: z.string().optional().transform((v) => v ? new Date(v) : undefined),
  status: z.enum(["draft", "planned", "active", "completed", "delayed"]).default("draft"),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { ctx, error } = await requireSession(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const fruitId = searchParams.get("fruitId");
  const year = searchParams.get("year");
  const status = searchParams.get("status");

  const campaigns = await prisma.fruitCampaign.findMany({
    where: {
      workspaceId: ctx.workspaceId,
      ...(fruitId ? { fruitId } : {}),
      ...(year ? { year: parseInt(year) } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: [{ year: "desc" }, { createdAt: "desc" }],
    include: {
      fruit: { select: { id: true, name: true, emoji: true, category: true } },
      tasks: { orderBy: { dueDate: "asc" } },
      performances: true,
      _count: { select: { tasks: true, performances: true, insights: true } },
    },
  });

  return apiResponse(campaigns);
}

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireSession(req);
  if (error) return error;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const fruit = await prisma.fruit.findFirst({
    where: { id: parsed.data.fruitId, workspaceId: ctx.workspaceId },
  });
  if (!fruit) return apiError("과일을 찾을 수 없습니다.", 404);

  const campaign = await prisma.fruitCampaign.create({
    data: { ...parsed.data, workspaceId: ctx.workspaceId, ownerId: ctx.userId },
    include: { fruit: { select: { name: true, emoji: true } } },
  });

  return apiResponse(campaign, 201);
}
