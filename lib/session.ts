import { auth } from "@/lib/auth";
import { apiError } from "@/lib/utils";

export interface SessionContext {
  userId: string;
  workspaceId: string;
}

/**
 * API route 핸들러에서 인증된 세션을 추출합니다.
 * 미인증 시 401 Response를 반환합니다.
 */
export async function requireSession(): Promise<
  { ctx: SessionContext; error: null } | { ctx: null; error: Response }
> {
  const session = await auth();
  const user = session?.user as any;

  if (!user?.id || !user?.workspaceId) {
    return { ctx: null, error: apiError("Unauthorized", 401) };
  }

  return {
    ctx: { userId: user.id as string, workspaceId: user.workspaceId as string },
    error: null,
  };
}
