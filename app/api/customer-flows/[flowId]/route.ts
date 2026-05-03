import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/utils";
import { requireSession } from "@/lib/session";

type Params = { params: Promise<{ flowId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { flowId } = await params;
  const { ctx, error } = await requireSession();
  if (error) return error;

  const existing = await prisma.customerFlow.findFirst({
    where: { id: flowId, session: { project: { workspaceId: ctx.workspaceId } } },
  });
  if (!existing) return apiError("Flow not found", 404);

  await prisma.customerFlow.delete({ where: { id: flowId } });
  return new Response(null, { status: 204 });
}
