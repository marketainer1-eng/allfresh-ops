import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const createSchema = z.object({
  sessionId: z.string().min(1),
  stepOrder: z.number().int().min(1),
  stepName: z.string().min(1),
  stepType: z.enum(["discovery", "consideration", "purchase", "fulfillment", "post_purchase", "retention"]),
  channel: z.string().optional(),
  description: z.string().optional(),
  expectedAction: z.string().optional(),
});

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

  const flows = await prisma.customerFlow.findMany({
    where: { sessionId },
    orderBy: { stepOrder: "asc" },
  });

  return apiResponse(flows);
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

  const flow = await prisma.customerFlow.create({ data: parsed.data });
  return apiResponse(flow, 201);
}
