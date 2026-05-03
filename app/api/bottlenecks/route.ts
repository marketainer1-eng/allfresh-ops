import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const { ctx, error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) return apiError("sessionId is required");

  const diagSession = await prisma.diagnosisSession.findFirst({
    where: { id: sessionId, project: { workspaceId: ctx.workspaceId } },
  });
  if (!diagSession) return apiError("Session not found", 404);

  const bottlenecks = await prisma.bottleneck.findMany({
    where: { sessionId },
    orderBy: { rank: "asc" },
  });

  return apiResponse(bottlenecks);
}
