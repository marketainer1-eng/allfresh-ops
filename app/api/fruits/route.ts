import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  variety: z.string().optional(),
  category: z.string().optional(),
  emoji: z.string().optional(),
  seasonStartMonth: z.number().int().min(1).max(12),
  seasonEndMonth: z.number().int().min(1).max(12),
  peakStartMonth: z.number().int().min(1).max(12),
  peakEndMonth: z.number().int().min(1).max(12),
  sourcingLeadDays: z.number().int().default(30),
  marketingLeadDays: z.number().int().default(14),
  defaultChannels: z.array(z.string()).default([]),
  priorityLevel: z.number().int().min(1).max(3).default(2),
  isActive: z.boolean().default(true),
  description: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { ctx, error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const isActive = searchParams.get("isActive");
  const category = searchParams.get("category");

  const fruits = await prisma.fruit.findMany({
    where: {
      workspaceId: ctx.workspaceId,
      ...(isActive !== null ? { isActive: isActive === "true" } : {}),
      ...(category ? { category } : {}),
    },
    orderBy: [{ priorityLevel: "desc" }, { name: "asc" }],
    include: {
      campaigns: {
        orderBy: { year: "desc" },
        take: 1,
      },
      tasks: {
        where: { status: { in: ["pending", "in_progress", "delayed"] } },
        orderBy: { dueDate: "asc" },
        take: 5,
      },
      _count: {
        select: { campaigns: true, tasks: true, performances: true },
      },
    },
  });

  return apiResponse(fruits);
}

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireSession();
  if (error) return error;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const fruit = await prisma.fruit.create({
    data: { ...parsed.data, workspaceId: ctx.workspaceId },
  });

  return apiResponse(fruit, 201);
}
