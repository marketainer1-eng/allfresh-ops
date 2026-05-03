import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const schema = z.object({
  sessionId: z.string().min(1),
  bottleneckId: z.string().min(1),
});

function derivePriority(totalScore: number): string {
  if (totalScore >= 56) return "critical";
  if (totalScore >= 42) return "high";
  if (totalScore >= 28) return "medium";
  return "low";
}

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireSession();
  if (error) return error;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Invalid input");

  const { sessionId, bottleneckId } = parsed.data;

  const diagSession = await prisma.diagnosisSession.findFirst({
    where: { id: sessionId, project: { workspaceId: ctx.workspaceId } },
  });
  if (!diagSession) return apiError("Session not found", 404);

  const bottleneck = await prisma.bottleneck.findFirst({
    where: { id: bottleneckId, sessionId },
  });
  if (!bottleneck) return apiError("Bottleneck not found", 404);

  const symptoms = await prisma.symptom.findMany({
    where: { id: { in: bottleneck.symptomIds } },
    select: { title: true },
  });

  const symptomTitles = symptoms.map((s) => s.title).join(", ");
  const priority = derivePriority(bottleneck.totalScore);

  const ticket = await prisma.ticketDraft.create({
    data: {
      sessionId,
      bottleneckId,
      title: `[${bottleneck.journeyStep.toUpperCase()}] ${bottleneck.label} 개선`,
      priority,
      type: "improvement",
      description: `총 ${bottleneck.symptomIds.length}개 증상에서 도출된 병목 (점수: ${bottleneck.totalScore}/70)\n관련 증상: ${symptomTitles}`,
      hypothesis: `${bottleneck.label} 문제를 해결하면 해당 여정 단계의 전환율이 개선될 것이다.`,
      proposedAction: `${bottleneck.label} 관련 UX/운영 개선 방안을 수립하고 A/B 테스트를 진행한다.`,
      successMetric: `${bottleneck.journeyStep} 단계 전환율 10% 이상 향상 (4주 내)`,
      tags: bottleneck.tags,
    },
  });

  await prisma.diagnosisSession.update({
    where: { id: sessionId },
    data: { status: "review" },
  });

  return apiResponse(ticket, 201);
}
