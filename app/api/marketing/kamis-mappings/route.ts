import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const createSchema = z.object({
  analysisId: z.string().optional().nullable(),
  productName: z.string().min(1, "상품명을 입력하세요."),
  categoryCode: z.string().min(1, "부류 코드는 필수입니다."),
  categoryName: z.string().optional(),
  itemCode: z.string().min(1, "품목 코드는 필수입니다."),
  itemName: z.string().optional(),
  kindCode: z.string().optional(),
  kindName: z.string().optional(),
  rankCode: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/marketing/kamis-mappings — 목록 (workspace 범위, 최신순)
export async function GET() {
  const { ctx, error } = await requireSession();
  if (error) return error;

  const data = await prisma.kamisMapping.findMany({
    where: { workspaceId: ctx.workspaceId },
    orderBy: { createdAt: "desc" },
  });

  return apiResponse({ data, total: data.length });
}

// POST /api/marketing/kamis-mappings — 생성
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
  const created = await prisma.kamisMapping.create({
    data: {
      workspaceId: ctx.workspaceId,
      createdBy: ctx.userId,
      analysisId: d.analysisId ?? undefined,
      productName: d.productName,
      categoryCode: d.categoryCode,
      categoryName: d.categoryName,
      itemCode: d.itemCode,
      itemName: d.itemName,
      kindCode: d.kindCode,
      kindName: d.kindName,
      rankCode: d.rankCode,
      isActive: d.isActive ?? true,
    },
  });

  return apiResponse(created, 201);
}
