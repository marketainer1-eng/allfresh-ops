import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const FRAMEWORKS = ["swot", "pest"] as const;

const itemSchema = z.object({
  framework: z.enum(FRAMEWORKS),
  category: z.string().min(1),
  content: z.string().min(1),
});

const bulkSchema = z.object({
  analysisId: z.string().min(1),
  items: z.array(itemSchema).min(1),
});

const singleSchema = z.object({
  analysisId: z.string().min(1),
  framework: z.enum(FRAMEWORKS),
  category: z.string().min(1),
  content: z.string().min(1),
});

// GET /api/marketing/strategy-items?analysisId=
export async function GET(req: NextRequest) {
  const { ctx, error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const analysisId = searchParams.get("analysisId")?.trim();
  if (!analysisId) return apiError("analysisId가 필요합니다.");

  const analysis = await prisma.analysis.findFirst({
    where: { id: analysisId, workspaceId: ctx.workspaceId },
    select: { id: true },
  });
  if (!analysis) return apiError("분석을 찾을 수 없습니다.", 404);

  const items = await prisma.strategyItem.findMany({
    where: { analysisId, workspaceId: ctx.workspaceId },
    orderBy: { createdAt: "asc" },
  });
  return apiResponse(items);
}

// POST /api/marketing/strategy-items
// Bulk (regeneration) body: { analysisId, items: [{framework,category,content}] }
// Single body: { analysisId, framework, category, content }
export async function POST(req: NextRequest) {
  const { ctx, error } = await requireSession();
  if (error) return error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 본문입니다.");
  }

  const single = singleSchema.safeParse(body);
  const bulk = bulkSchema.safeParse(body);
  if (!single.success && !bulk.success) {
    return apiError(bulk.error.message);
  }

  const analysisId = bulk.success ? bulk.data.analysisId : single.data!.analysisId;

  const analysis = await prisma.analysis.findFirst({
    where: { id: analysisId, workspaceId: ctx.workspaceId },
    select: { id: true },
  });
  if (!analysis) return apiError("분석을 찾을 수 없습니다.", 404);

  if (bulk.success) {
    await prisma.strategyItem.deleteMany({
      where: { analysisId, workspaceId: ctx.workspaceId },
    });
    await prisma.strategyItem.createMany({
      data: bulk.data.items.map((it) => ({
        workspaceId: ctx.workspaceId,
        analysisId,
        framework: it.framework,
        category: it.category,
        content: it.content,
      })),
    });
  } else {
    const d = single.data!;
    await prisma.strategyItem.create({
      data: {
        workspaceId: ctx.workspaceId,
        analysisId,
        framework: d.framework,
        category: d.category,
        content: d.content,
      },
    });
  }

  const items = await prisma.strategyItem.findMany({
    where: { analysisId, workspaceId: ctx.workspaceId },
    orderBy: { createdAt: "asc" },
  });
  return apiResponse(items, 201);
}
