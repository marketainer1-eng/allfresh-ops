import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const createSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1),
  objective: z.string().optional(),
  periodStart: z.string().optional().transform((v) => (v ? new Date(v) : undefined)),
  periodEnd: z.string().optional().transform((v) => (v ? new Date(v) : undefined)),
});

export async function GET(req: NextRequest) {
  const { ctx, error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const sessions = await prisma.diagnosisSession.findMany({
    where: {
      project: { workspaceId: ctx.workspaceId },
      ...(projectId ? { projectId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      project: { select: { name: true, brand: true } },
      _count: { select: { symptoms: true, bottlenecks: true, ticketDrafts: true } },
    },
  });

  return apiResponse(sessions);
}

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireSession();
  if (error) return error;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Invalid input");

  const project = await prisma.project.findFirst({
    where: { id: parsed.data.projectId, workspaceId: ctx.workspaceId },
  });
  if (!project) return apiError("Project not found", 404);

  const session = await prisma.diagnosisSession.create({
    data: {
      projectId: parsed.data.projectId,
      title: parsed.data.title,
      objective: parsed.data.objective,
      periodStart: parsed.data.periodStart,
      periodEnd: parsed.data.periodEnd,
      createdBy: ctx.userId,
    },
  });

  return apiResponse(session, 201);
}
