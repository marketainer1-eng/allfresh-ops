import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const createSchema = z.object({
  analysisId: z.string().optional().nullable(),
  productName: z.string().min(1, "상품명을 입력하세요."),
  origin: z.string().optional(),
  grade: z.string().optional(),
  salePrice: z.number().optional(),
  wholesalePrice: z.number().optional(),
  discountRate: z.number().optional(),
  avgTemperature: z.number().optional(),
  rainfall: z.number().optional(),
  isHoliday: z.boolean().optional(),
  dayOfWeek: z.string().optional(),
  month: z.number().int().optional(),
  season: z.string().optional(),
  previousDaySales: z.number().optional(),
  lastWeekSales: z.number().optional(),
  lastYearSales: z.number().optional(),
  modelType: z.string().optional(),
  predictedDemand: z.number().optional(),
  confidenceR2: z.number().optional(),
  rmse: z.number().optional(),
  mape: z.number().optional(),
  featureImportance: z.record(z.number()).optional(),
  recommendation: z.string().optional(),
});

// GET /api/marketing/forecasts — 목록 (workspace 범위, 최신순)
export async function GET() {
  const { ctx, error } = await requireSession();
  if (error) return error;

  const data = await prisma.demandForecast.findMany({
    where: { workspaceId: ctx.workspaceId },
    orderBy: { createdAt: "desc" },
  });

  return apiResponse({ data, total: data.length });
}

// POST /api/marketing/forecasts — 생성
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
  const created = await prisma.demandForecast.create({
    data: {
      workspaceId: ctx.workspaceId,
      createdBy: ctx.userId,
      analysisId: d.analysisId ?? undefined,
      productName: d.productName,
      origin: d.origin,
      grade: d.grade,
      salePrice: d.salePrice,
      wholesalePrice: d.wholesalePrice,
      discountRate: d.discountRate,
      avgTemperature: d.avgTemperature,
      rainfall: d.rainfall,
      isHoliday: d.isHoliday ?? false,
      dayOfWeek: d.dayOfWeek,
      month: d.month,
      season: d.season,
      previousDaySales: d.previousDaySales,
      lastWeekSales: d.lastWeekSales,
      lastYearSales: d.lastYearSales,
      modelType: d.modelType,
      predictedDemand: d.predictedDemand,
      confidenceR2: d.confidenceR2,
      rmse: d.rmse,
      mape: d.mape,
      featureImportance: d.featureImportance ?? undefined,
      recommendation: d.recommendation,
    },
  });

  return apiResponse(created, 201);
}
