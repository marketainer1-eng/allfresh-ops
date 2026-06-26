import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const createSchema = z.object({
  analysisId: z.string().min(1),
  title: z.string().min(1).default("새 실행 작업"),
  description: z.string().default(""),
  channel: z.string().min(1).default("detail_copy"),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  recommendedDate: z.string().optional(),
  assignee: z.string().default(""),
  contentPlanId: z.string().nullable().optional(),
});

// POST /api/marketing/execution-tasks — 단건 실행 작업 추가
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

  const analysis = await prisma.analysis.findFirst({
    where: { id: d.analysisId, workspaceId: ctx.workspaceId },
    select: { id: true },
  });
  if (!analysis) return apiError("분석을 찾을 수 없습니다.", 404);

  let recommendedDate = d.recommendedDate ? new Date(d.recommendedDate) : new Date();
  if (isNaN(recommendedDate.getTime())) recommendedDate = new Date();

  const created = await prisma.executionTask.create({
    data: {
      workspaceId: ctx.workspaceId,
      analysisId: d.analysisId,
      contentPlanId: d.contentPlanId ?? null,
      title: d.title,
      description: d.description,
      channel: d.channel,
      priority: d.priority,
      recommendedDate,
      assignee: d.assignee,
      status: "pending",
    },
  });
  return apiResponse(created, 201);
}
