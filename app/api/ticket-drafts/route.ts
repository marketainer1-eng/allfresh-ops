import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const { ctx, error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  const projectId = searchParams.get("projectId");

  const tickets = await prisma.ticketDraft.findMany({
    where: {
      session: {
        project: { workspaceId: ctx.workspaceId },
        ...(projectId ? { projectId } : {}),
        ...(sessionId ? { id: sessionId } : {}),
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      bottleneck: { select: { label: true, journeyStep: true } },
      session: { select: { id: true, title: true } },
    },
  });

  // rechecks 페이지에서 sessionId가 필요하므로 flatten
  const result = tickets.map((t) => ({
    ...t,
    sessionId: t.session.id,
    sessionTitle: t.session.title,
  }));

  return apiResponse(result);
}
