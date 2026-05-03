import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const createSchema = z.object({
  sessionId: z.string().min(1),
  title: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { ctx, error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const reports = await prisma.report.findMany({
    where: {
      session: { project: { workspaceId: ctx.workspaceId } },
      ...(projectId ? { projectId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { session: { select: { title: true } } },
  });

  return apiResponse(reports);
}

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireSession();
  if (error) return error;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Invalid input");

  const { sessionId } = parsed.data;

  const diagSession = await prisma.diagnosisSession.findFirst({
    where: { id: sessionId, project: { workspaceId: ctx.workspaceId } },
    include: {
      project: true,
      _count: { select: { symptoms: true, bottlenecks: true, ticketDrafts: true } },
    },
  });
  if (!diagSession) return apiError("Session not found", 404);

  const topBottleneck = await prisma.bottleneck.findFirst({
    where: { sessionId },
    orderBy: { rank: "asc" },
  });

  const report = await prisma.report.create({
    data: {
      sessionId,
      projectId: diagSession.projectId,
      title: parsed.data.title ?? `${diagSession.title} — 진단 리포트`,
      symptomCount: diagSession._count.symptoms,
      bottleneckCount: diagSession._count.bottlenecks,
      ticketCount: diagSession._count.ticketDrafts,
      topBottleneck: topBottleneck?.label,
      summary: diagSession.summary,
      status: "draft",
    },
  });

  await prisma.diagnosisSession.update({
    where: { id: sessionId },
    data: { status: "completed" },
  });

  return apiResponse(report, 201);
}
