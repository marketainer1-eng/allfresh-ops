import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  variety: z.string().optional(),
  category: z.string().optional(),
  emoji: z.string().optional(),
  seasonStartMonth: z.number().int().min(1).max(12).optional(),
  seasonEndMonth: z.number().int().min(1).max(12).optional(),
  peakStartMonth: z.number().int().min(1).max(12).optional(),
  peakEndMonth: z.number().int().min(1).max(12).optional(),
  sourcingLeadDays: z.number().int().optional(),
  marketingLeadDays: z.number().int().optional(),
  defaultChannels: z.array(z.string()).optional(),
  priorityLevel: z.number().int().min(1).max(3).optional(),
  isActive: z.boolean().optional(),
  description: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ fruitId: string }> }
) {
  const { ctx, error } = await requireSession(req);
  if (error) return error;
  const { fruitId } = await params;

  const fruit = await prisma.fruit.findFirst({
    where: { id: fruitId, workspaceId: ctx.workspaceId },
    include: {
      campaigns: {
        orderBy: { year: "desc" },
        include: {
          tasks: { orderBy: { dueDate: "asc" } },
          performances: true,
          insights: true,
        },
      },
      tasks: {
        orderBy: { dueDate: "asc" },
        include: { campaign: { select: { title: true, year: true } } },
      },
      performances: { orderBy: { createdAt: "desc" } },
      insights: { orderBy: { sourceYear: "desc" } },
    },
  });

  if (!fruit) return apiError("과일을 찾을 수 없습니다.", 404);
  return apiResponse(fruit);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ fruitId: string }> }
) {
  const { ctx, error } = await requireSession(req);
  if (error) return error;
  const { fruitId } = await params;

  const existing = await prisma.fruit.findFirst({
    where: { id: fruitId, workspaceId: ctx.workspaceId },
  });
  if (!existing) return apiError("과일을 찾을 수 없습니다.", 404);

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const updated = await prisma.fruit.update({
    where: { id: fruitId },
    data: parsed.data,
  });

  return apiResponse(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ fruitId: string }> }
) {
  const { ctx, error } = await requireSession(req);
  if (error) return error;
  const { fruitId } = await params;

  const existing = await prisma.fruit.findFirst({
    where: { id: fruitId, workspaceId: ctx.workspaceId },
  });
  if (!existing) return apiError("과일을 찾을 수 없습니다.", 404);

  await prisma.fruit.delete({ where: { id: fruitId } });
  return new Response(null, { status: 204 });
}
