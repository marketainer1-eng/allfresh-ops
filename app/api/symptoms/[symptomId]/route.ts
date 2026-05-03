import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";

type Params = { params: Promise<{ symptomId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { symptomId } = await params;
  const { ctx, error } = await requireSession();
  if (error) return error;

  const symptom = await prisma.symptom.findFirst({
    where: { id: symptomId, session: { project: { workspaceId: ctx.workspaceId } } },
    include: { evidenceItems: true },
  });

  if (!symptom) return apiError("Symptom not found", 404);
  return apiResponse(symptom);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { symptomId } = await params;
  const { ctx, error } = await requireSession();
  if (error) return error;

  const existing = await prisma.symptom.findFirst({
    where: { id: symptomId, session: { project: { workspaceId: ctx.workspaceId } } },
  });
  if (!existing) return apiError("Symptom not found", 404);

  await prisma.symptom.delete({ where: { id: symptomId } });
  return new Response(null, { status: 204 });
}
