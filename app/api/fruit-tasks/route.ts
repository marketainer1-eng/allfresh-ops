import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const createSchema = z.object({
  fruitId: z.string().min(1),
  campaignId: z.string().optional(),
  type: z.enum(["sourcing", "pricing", "content", "sales", "review"]),
  title: z.string().min(1),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional().transform((v) => v ? new Date(v) : undefined),
  status: z.enum(["pending", "in_progress", "done", "delayed"]).default("pending"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { ctx, error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const fruitId = searchParams.get("fruitId");
  const campaignId = searchParams.get("campaignId");
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const overdue = searchParams.get("overdue");

  const now = new Date();

  const tasks = await prisma.fruitTask.findMany({
    where: {
      workspaceId: ctx.workspaceId,
      ...(fruitId ? { fruitId } : {}),
      ...(campaignId ? { campaignId } : {}),
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(overdue === "true"
        ? { dueDate: { lt: now }, status: { notIn: ["done"] } }
        : {}),
    },
    orderBy: { dueDate: "asc" },
    include: {
      fruit: { select: { id: true, name: true, emoji: true } },
      campaign: { select: { id: true, title: true, year: true } },
    },
  });

  return apiResponse(tasks);
}

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireSession();
  if (error) return error;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const task = await prisma.fruitTask.create({
    data: { ...parsed.data, workspaceId: ctx.workspaceId },
    include: { fruit: { select: { name: true, emoji: true } } },
  });

  return apiResponse(task, 201);
}
