import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  brand: z.string().optional(),
  status: z.enum(["active", "paused", "completed", "archived"]).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const { ctx, error } = await requireSession();
  if (error) return error;

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId: ctx.workspaceId },
    include: {
      organization: true,
      sessions: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { symptoms: true, bottlenecks: true, ticketDrafts: true } } },
      },
    },
  });

  if (!project) return apiError("Project not found", 404);
  return apiResponse(project);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const { ctx, error } = await requireSession();
  if (error) return error;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Invalid input");

  const existing = await prisma.project.findFirst({
    where: { id: projectId, workspaceId: ctx.workspaceId },
  });
  if (!existing) return apiError("Project not found", 404);

  const project = await prisma.project.update({ where: { id: projectId }, data: parsed.data });
  return apiResponse(project);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const { ctx, error } = await requireSession();
  if (error) return error;

  const existing = await prisma.project.findFirst({
    where: { id: projectId, workspaceId: ctx.workspaceId },
  });
  if (!existing) return apiError("Project not found", 404);

  await prisma.project.delete({ where: { id: projectId } });
  return new Response(null, { status: 204 });
}
