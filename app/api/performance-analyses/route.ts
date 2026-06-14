// app/api/performance-analyses/route.ts
// 성과분석 결과 저장(POST) / 목록(GET). 워크스페이스 단위로 격리, 인증 필요.

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { apiError, apiResponse } from "@/lib/utils";
import type { PerfRequest, PerfResponse } from "@/lib/performanceTypes";

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireSession();
  if (error) return error;
  try {
    const body = await req.json();
    const request = body.request as PerfRequest | undefined;
    const result = body.result as PerfResponse | undefined;
    if (!request || !result) return apiError("request/result가 필요합니다.", 400);

    const created = await prisma.performanceAnalysis.create({
      data: {
        workspaceId: ctx.workspaceId,
        createdBy: ctx.userId,
        title:
          (typeof body.title === "string" && body.title.trim().slice(0, 200)) ||
          `성과분석 ${new Date().toISOString().slice(0, 10)}`,
        periodStart: request.period?.start ?? null,
        periodEnd: request.period?.end ?? null,
        seasonFlag: request.seasonFlag ?? null,
        engine: typeof body.engine === "string" ? body.engine : null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        request: request as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result: result as any,
      },
      select: { id: true },
    });
    return apiResponse({ id: created.id }, 201);
  } catch (e) {
    console.error("save performance-analysis error:", e);
    return apiError(e instanceof Error ? e.message : "저장 중 오류", 500);
  }
}

export async function GET() {
  const { ctx, error } = await requireSession();
  if (error) return error;
  const items = await prisma.performanceAnalysis.findMany({
    where: { workspaceId: ctx.workspaceId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      periodStart: true,
      periodEnd: true,
      seasonFlag: true,
      engine: true,
      createdAt: true,
    },
    take: 100,
  });
  return apiResponse(items);
}
