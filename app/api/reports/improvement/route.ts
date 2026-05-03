import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const { ctx, error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const rechecks = await prisma.recheck.findMany({
    where: {
      session: {
        project: {
          workspaceId: ctx.workspaceId,
          ...(projectId ? { id: projectId } : {}),
        },
      },
    },
    include: {
      ticket: { select: { title: true, priority: true } },
      session: { select: { title: true } },
    },
  });

  const total = rechecks.length;
  const summary = {
    total,
    improved: rechecks.filter((r) => r.result === "improved").length,
    unchanged: rechecks.filter((r) => r.result === "unchanged").length,
    worsened: rechecks.filter((r) => r.result === "worsened").length,
    improvementRate: total > 0
      ? Math.round((rechecks.filter((r) => r.result === "improved").length / total) * 100)
      : 0,
    items: rechecks,
  };

  return apiResponse(summary);
}
