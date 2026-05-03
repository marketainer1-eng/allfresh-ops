import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const createSchema = z.object({
  ticketId: z.string().min(1),
  sessionId: z.string().min(1),
  checkDate: z.string().transform((v) => new Date(v)),
  result: z.enum(["improved", "unchanged", "worsened"]),
  metricBefore: z.string().optional(),
  metricAfter: z.string().optional(),
  note: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { ctx, error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  const ticketId = searchParams.get("ticketId");
  const projectId = searchParams.get("projectId");

  const rechecks = await prisma.recheck.findMany({
    where: {
      session: {
        project: { workspaceId: ctx.workspaceId },
        ...(projectId ? { projectId } : {}),
      },
      ...(sessionId ? { sessionId } : {}),
      ...(ticketId ? { ticketId } : {}),
    },
    orderBy: { checkDate: "desc" },
    include: {
      ticket: { select: { title: true, priority: true } },
      session: { select: { title: true } },
    },
  });

  return apiResponse(rechecks);
}

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireSession();
  if (error) return error;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Invalid input");

  const diagSession = await prisma.diagnosisSession.findFirst({
    where: { id: parsed.data.sessionId, project: { workspaceId: ctx.workspaceId } },
  });
  if (!diagSession) return apiError("Session not found", 404);

  const ticket = await prisma.ticketDraft.findFirst({
    where: { id: parsed.data.ticketId, sessionId: parsed.data.sessionId },
  });
  if (!ticket) return apiError("Ticket not found", 404);

  const recheck = await prisma.recheck.create({
    data: { ...parsed.data, checkedBy: ctx.userId },
  });

  return apiResponse(recheck, 201);
}
