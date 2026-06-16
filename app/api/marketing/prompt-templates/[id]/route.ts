import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  variables: z.array(z.string()).optional(),
});

// PATCH /api/marketing/prompt-templates/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.promptTemplate.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
  });
  if (!existing) return apiError("템플릿을 찾을 수 없습니다.", 404);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 본문입니다.");
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const d = parsed.data;
  const updated = await prisma.promptTemplate.update({
    where: { id },
    data: {
      name: d.name,
      description: d.description,
      content: d.content,
      variables: d.variables ?? undefined,
    },
  });
  return apiResponse(updated);
}
