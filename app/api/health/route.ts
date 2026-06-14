// app/api/health/route.ts
// 배포 환경변수 배선 검증용 헬스체크. 민감값은 노출하지 않고 존재여부(boolean)와
// DB 카운트만 반환한다. 시드된 DB를 가리키면 users=3, workspaces=1 이 나와야 한다.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const out: Record<string, unknown> = {
    env: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      AUTH_SECRET: !!(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET),
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL ?? "(default)",
    },
  };
  try {
    const [users, workspaces] = await Promise.all([
      prisma.user.count(),
      prisma.workspace.count(),
    ]);
    out.db = { ok: true, users, workspaces };
  } catch (e) {
    out.db = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
  return NextResponse.json(out);
}
