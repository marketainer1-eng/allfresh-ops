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

const campaignSchema = z.object({
  title: z.string().min(1, "제목을 입력하세요."),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  startDate: isoDate,
  endDate: isoDate,
  status: z.enum(["planned", "active", "completed"]).optional(),
  color: z.string().nullable().optional(),
  channel: z.string().nullable().optional(),
  assignee: z.string().nullable().optional(),
  analysisId: z.string().nullable().optional(),
});

const createSchema = z.union([
  campaignSchema,
  z.object({ items: z.array(campaignSchema).min(1) }),
]);

// GET /api/marketing/campaigns?from=ISO&to=ISO
export async function GET(req: NextRequest) {
  const { ctx, error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const fromDate = from && !isNaN(new Date(from).getTime()) ? new Date(from) : null;
  const toDate = to && !isNaN(new Date(to).getTime()) ? new Date(to) : null;

  // 기간이 주어지면 겹치는 캠페인만: startDate <= to AND endDate >= from
  const where = {
    workspaceId: ctx.workspaceId,
    ...(fromDate || toDate
      ? {
          ...(toDate ? { startDate: { lte: toDate } } : {}),
          ...(fromDate ? { endDate: { gte: fromDate } } : {}),
        }
      : {}),
  };

  const data = await prisma.marketingCampaign.findMany({
    where,
    orderBy: { startDate: "asc" },
  });

  return apiResponse({ data });
}

// POST /api/marketing/campaigns  (단건 또는 { items: [...] } 벌크)
export async function POST(req: NextRequest) {
  const { ctx, error } = await requireSession();
  if (error) return error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 본문입니다.");
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const list =
    "items" in parsed.data ? parsed.data.items : [parsed.data];

  const toData = (c: z.infer<typeof campaignSchema>) => ({
    workspaceId: ctx.workspaceId,
    createdBy: ctx.userId,
    title: c.title,
    description: c.description ?? undefined,
    category: c.category ?? undefined,
    startDate: new Date(c.startDate),
    endDate: new Date(c.endDate),
    status: c.status ?? "planned",
    color: c.color ?? undefined,
    channel: c.channel ?? undefined,
    assignee: c.assignee ?? undefined,
    analysisId: c.analysisId ?? undefined,
  });

  if ("items" in parsed.data) {
    const created = await prisma.$transaction(
      list.map((c) => prisma.marketingCampaign.create({ data: toData(c) })),
    );
    return apiResponse({ data: created }, 201);
  }

  const created = await prisma.marketingCampaign.create({
    data: toData(list[0]),
  });
  return apiResponse(created, 201);
}
