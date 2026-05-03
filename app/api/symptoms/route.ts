import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const createSchema = z.object({
  sessionId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  quote: z.string().optional(),
  journeyStep: z.enum(["discovery", "consideration", "purchase", "fulfillment", "post_purchase", "retention"]),
  severity: z.number().int().min(1).max(5).default(1),
  frequency: z.number().int().min(1).max(5).default(1),
  channel: z.string().optional(),
  tags: z.array(z.string()).default([]),
  businessImpact: z.number().int().min(1).max(5).default(1),
});

export async function GET(req: NextRequest) {
  const { ctx, error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  const limit = Number(searchParams.get("limit") ?? "200");

  if (!sessionId) return apiError("sessionId is required");

  const diagSession = await prisma.diagnosisSession.findFirst({
    where: { id: sessionId, project: { workspaceId: ctx.workspaceId } },
  });
  if (!diagSession) return apiError("Session not found", 404);

  const symptoms = await prisma.symptom.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return apiResponse(symptoms);
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

  const symptom = await prisma.symptom.create({ data: parsed.data });
  return apiResponse(symptom, 201);
}
