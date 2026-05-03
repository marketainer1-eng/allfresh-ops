import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  status: z.enum(["draft", "collecting", "analyzing", "review", "completed"]).optional(),
  objective: z.string().optional(),
  summary: z.string().optional(),
});

type Params = { params: Promise<{ sessionId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { sessionId } = await params;
  const { ctx, error } = await requireSession();
  if (error) return error;

  const session = await prisma.diagnosisSession.findFirst({
    where: { id: sessionId, project: { workspaceId: ctx.workspaceId } },
    include: {
      project: true,
      _count: { select: { symptoms: true, bottlenecks: true, ticketDrafts: true, rechecks: true } },
    },
  });

  if (!session) return apiError("Session not found", 404);
  return apiResponse(session);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { sessionId } = await params;
  const { ctx, error } = await requireSession();
  if (error) return error;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Invalid input");

  const existing = await prisma.diagnosisSession.findFirst({
    where: { id: sessionId, project: { workspaceId: ctx.workspaceId } },
  });
  if (!existing) return apiError("Session not found", 404);

  const updated = await prisma.diagnosisSession.update({
    where: { id: sessionId },
    data: parsed.data,
  });
  return apiResponse(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { sessionId } = await params;
  const { ctx, error } = await requireSession();
  if (error) return error;

  const existing = await prisma.diagnosisSession.findFirst({
    where: { id: sessionId, project: { workspaceId: ctx.workspaceId } },
  });
  if (!existing) return apiError("Session not found", 404);

  await prisma.diagnosisSession.delete({ where: { id: sessionId } });
  return new Response(null, { status: 204 });
}
