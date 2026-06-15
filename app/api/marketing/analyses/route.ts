import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const channelRecSchema = z.object({
  channel: z.string(),
  priority: z.string(),
  reasoning: z.string(),
});

const createSchema = z.object({
  productName: z.string().min(1, "상품명을 입력하세요."),
  category: z.enum(["single", "giftset", "subscription"]),
  inputMode: z.string().optional(),
  productInfo: z.string().optional(),
  sourceUrl: z.string().optional(),
  fileName: z.string().optional(),
  attributes: z.record(z.any()).optional(),
  targetCustomer: z.string().optional(),
  marketingCopy: z.string().optional(),
  seoKeywords: z.array(z.string()).optional(),
  seasonalCampaign: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  pricePositioning: z.string().optional(),
  differentiation: z.string().optional(),
  recommendedChannels: z.array(channelRecSchema).optional(),
  thumbnailUrl: z.string().optional(),
  status: z.string().optional(),
});

// GET /api/marketing/analyses?search=&category=&page=1&pageSize=12
export async function GET(req: NextRequest) {
  const { ctx, error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim();
  const category = searchParams.get("category")?.trim();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") || "12", 10)),
  );

  const where = {
    workspaceId: ctx.workspaceId,
    ...(category && category !== "all" ? { category } : {}),
    ...(search
      ? { productName: { contains: search, mode: "insensitive" as const } }
      : {}),
  };

  const [total, data] = await Promise.all([
    prisma.analysis.count({ where }),
    prisma.analysis.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return apiResponse({
    data,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

// POST /api/marketing/analyses
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

  const d = parsed.data;
  const created = await prisma.analysis.create({
    data: {
      workspaceId: ctx.workspaceId,
      createdBy: ctx.userId,
      productName: d.productName,
      category: d.category,
      inputMode: d.inputMode,
      productInfo: d.productInfo,
      sourceUrl: d.sourceUrl,
      fileName: d.fileName,
      attributes: d.attributes ?? undefined,
      targetCustomer: d.targetCustomer,
      marketingCopy: d.marketingCopy,
      seoKeywords: d.seoKeywords ?? undefined,
      seasonalCampaign: d.seasonalCampaign,
      hashtags: d.hashtags ?? undefined,
      pricePositioning: d.pricePositioning,
      differentiation: d.differentiation,
      recommendedChannels: d.recommendedChannels ?? undefined,
      thumbnailUrl: d.thumbnailUrl,
      status: d.status ?? "completed",
    },
  });

  return apiResponse(created, 201);
}
