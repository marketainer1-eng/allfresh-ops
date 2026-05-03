import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  status: z.enum(["active", "paused", "completed", "archived"]).default("active"),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  organizationId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { ctx, error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const projects = await prisma.project.findMany({
    where: { workspaceId: ctx.workspaceId, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    include: {
      organization: { select: { name: true } },
      _count: { select: { sessions: true } },
    },
  });

  return apiResponse(projects);
}

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireSession();
  if (error) return error;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Invalid input");

  const project = await prisma.project.create({
    data: { ...parsed.data, workspaceId: ctx.workspaceId, createdBy: ctx.userId },
  });

  return apiResponse(project, 201);
}
