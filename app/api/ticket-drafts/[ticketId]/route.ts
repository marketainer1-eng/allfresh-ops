import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().optional(),
  status: z.enum(["draft", "confirmed", "in_progress", "done", "cancelled"]).optional(),
  assignee: z.string().optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
  hypothesis: z.string().optional(),
  proposedAction: z.string().optional(),
  successMetric: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const { ctx, error } = await requireSession();
  if (error) return error;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Invalid input");

  const existing = await prisma.ticketDraft.findFirst({
    where: { id: ticketId, session: { project: { workspaceId: ctx.workspaceId } } },
  });
  if (!existing) return apiError("Ticket not found", 404);

  const updated = await prisma.ticketDraft.update({
    where: { id: ticketId },
    data: parsed.data,
  });
  return apiResponse(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const { ctx, error } = await requireSession();
  if (error) return error;

  const existing = await prisma.ticketDraft.findFirst({
    where: { id: ticketId, session: { project: { workspaceId: ctx.workspaceId } } },
  });
  if (!existing) return apiError("Ticket not found", 404);

  await prisma.ticketDraft.delete({ where: { id: ticketId } });
  return new Response(null, { status: 204 });
}
