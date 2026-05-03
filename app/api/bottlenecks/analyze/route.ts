import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { analyzeBottlenecks } from "@/lib/scoring/bottleneck";
import { z } from "zod";

const schema = z.object({
  sessionId: z.string().min(1),
  topN: z.number().int().min(1).max(10).default(3),
});

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireSession();
  if (error) return error;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Invalid input");

  const { sessionId, topN } = parsed.data;

  const diagSession = await prisma.diagnosisSession.findFirst({
    where: { id: sessionId, project: { workspaceId: ctx.workspaceId } },
  });
  if (!diagSession) return apiError("Session not found", 404);

  const symptoms = await prisma.symptom.findMany({
    where: { sessionId },
    select: {
      id: true,
      title: true,
      journeyStep: true,
      severity: true,
      frequency: true,
      evidenceCount: true,
      businessImpact: true,
      tags: true,
    },
  });

  if (symptoms.length < 1) return apiError("증상을 최소 1개 이상 수집해야 합니다.", 422);

  const results = analyzeBottlenecks(symptoms, topN);

  await prisma.bottleneck.deleteMany({ where: { sessionId } });

  const saved = await prisma.$transaction(
    results.map((r) =>
      prisma.bottleneck.create({
        data: {
          sessionId,
          rank: r.rank,
          journeyStep: r.journeyStep,
          label: r.label,
          totalScore: r.totalScore,
          severityScore: r.severityScore,
          frequencyScore: r.frequencyScore,
          evidenceScore: r.evidenceScore,
          businessImpactScore: r.businessImpactScore,
          symptomIds: r.symptomIds,
          tags: r.tags,
          description: r.description,
        },
      })
    )
  );

  await prisma.diagnosisSession.update({
    where: { id: sessionId },
    data: { status: "analyzing" },
  });

  return apiResponse({ bottlenecks: saved, analyzedAt: new Date().toISOString() });
}
