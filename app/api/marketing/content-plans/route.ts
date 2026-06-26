import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const CHANNELS = [
  "youtube_shorts",
  "instagram_reels",
  "instagram_feed",
  "naver_blog",
  "detail_copy",
  "promotion",
] as const;

const contentPlanSchema = z.object({
  channel: z.string().min(1),
  title: z.string(),
  description: z.string(),
  keyPoints: z.array(z.string()).default([]),
  hashtags: z.array(z.string()).default([]),
});

const executionTaskSchema = z.object({
  title: z.string(),
  description: z.string(),
  channel: z.string().min(1),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  recommendedDate: z.string(),
  assignee: z.string().default(""),
  contentPlanChannel: z.string().optional(),
});

const createSchema = z.object({
  analysisId: z.string().min(1),
  contentPlans: z.array(contentPlanSchema).default([]),
  executionTasks: z.array(executionTaskSchema).default([]),
});

// GET /api/marketing/content-plans?analysisId=
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

  const contentPlans = await prisma.contentPlan.findMany({
    where: { analysisId, workspaceId: ctx.workspaceId },
    include: { executionTasks: { orderBy: { recommendedDate: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
  return apiResponse(contentPlans);
}

// POST /api/marketing/content-plans  — regeneration: replace plans + tasks for analysis
export async function POST(req: NextRequest) {
  const { ctx, error } = await requireSession();
  if (error) return error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 본문입니다.");
  }

  // 단건 추가: { analysisId, plan: {...} } — 기존 항목을 지우지 않고 1건만 생성
  const singleSchema = z.object({
    analysisId: z.string().min(1),
    plan: contentPlanSchema,
  });
  const single = singleSchema.safeParse(body);
  if (single.success) {
    const { analysisId, plan } = single.data;
    const ownerAnalysis = await prisma.analysis.findFirst({
      where: { id: analysisId, workspaceId: ctx.workspaceId },
      select: { id: true },
    });
    if (!ownerAnalysis) return apiError("분석을 찾을 수 없습니다.", 404);
    const ch = (CHANNELS as readonly string[]).includes(plan.channel)
      ? plan.channel
      : "detail_copy";
    const created = await prisma.contentPlan.create({
      data: {
        workspaceId: ctx.workspaceId,
        analysisId,
        channel: ch,
        title: plan.title,
        description: plan.description,
        keyPoints: plan.keyPoints,
        hashtags: plan.hashtags,
        status: "draft",
      },
      include: { executionTasks: true },
    });
    return apiResponse(created, 201);
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const { analysisId, contentPlans, executionTasks } = parsed.data;

  const analysis = await prisma.analysis.findFirst({
    where: { id: analysisId, workspaceId: ctx.workspaceId },
    select: { id: true },
  });
  if (!analysis) return apiError("분석을 찾을 수 없습니다.", 404);

  const normChannel = (ch: string) =>
    (CHANNELS as readonly string[]).includes(ch) ? ch : "detail_copy";

  // Clean regenerate. Delete tasks first (FK to plans), then plans.
  await prisma.executionTask.deleteMany({
    where: { analysisId, workspaceId: ctx.workspaceId },
  });
  await prisma.contentPlan.deleteMany({
    where: { analysisId, workspaceId: ctx.workspaceId },
  });

  // Create content plans, building a channel -> id map for task linking.
  const planIdByChannel: Record<string, string> = {};
  for (const p of contentPlans) {
    const ch = normChannel(p.channel);
    const created = await prisma.contentPlan.create({
      data: {
        workspaceId: ctx.workspaceId,
        analysisId,
        channel: ch,
        title: p.title,
        description: p.description,
        keyPoints: p.keyPoints,
        hashtags: p.hashtags,
        status: "draft",
      },
    });
    if (!planIdByChannel[ch]) planIdByChannel[ch] = created.id;
  }

  for (const t of executionTasks) {
    const ch = normChannel(t.channel);
    const linkChannel = t.contentPlanChannel
      ? normChannel(t.contentPlanChannel)
      : ch;
    let recommendedDate = new Date(t.recommendedDate);
    if (isNaN(recommendedDate.getTime())) recommendedDate = new Date();
    await prisma.executionTask.create({
      data: {
        workspaceId: ctx.workspaceId,
        analysisId,
        contentPlanId: planIdByChannel[linkChannel] ?? null,
        title: t.title,
        description: t.description,
        channel: ch,
        priority: t.priority,
        recommendedDate,
        assignee: t.assignee,
        status: "pending",
      },
    });
  }

  const [createdPlans, createdTasks] = await Promise.all([
    prisma.contentPlan.findMany({
      where: { analysisId, workspaceId: ctx.workspaceId },
      include: { executionTasks: { orderBy: { recommendedDate: "asc" } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.executionTask.findMany({
      where: { analysisId, workspaceId: ctx.workspaceId },
      orderBy: { recommendedDate: "asc" },
    }),
  ]);

  return apiResponse(
    { contentPlans: createdPlans, executionTasks: createdTasks },
    201,
  );
}
