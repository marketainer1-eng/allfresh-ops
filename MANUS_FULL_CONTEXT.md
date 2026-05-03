# 올프레쉬 OPS — Manus 완전 인수인계

> 작성일: 2026-04-26 | 목적: 개별 업로드된 파일의 폴더 구조 재현

---

## ★ 즉시 실행 순서

```bash
pnpm install
cp .env.example .env   # DATABASE_URL / AUTH_SECRET / NEXTAUTH_URL 입력
pnpm db:push
pnpm db:seed
pnpm dev               # http://localhost:3000
# 로그인: admin@allfresh.co.kr / admin1234
```

---

## ★ 정확한 폴더 구조

```
allfresh-ops/
├── app/
│   ├── globals.css
│   ├── layout.tsx                     ← 루트 레이아웃
│   ├── page.tsx                       ← 랜딩 (/)
│   ├── (app)/
│   │   ├── layout.tsx                 ← 앱 레이아웃(사이드바+헤더)
│   │   └── app/
│   │       ├── page.tsx               ← /app 대시보드
│   │       ├── calendar/page.tsx      ← /app/calendar
│   │       ├── campaigns/page.tsx     ← /app/campaigns
│   │       ├── reports/page.tsx       ← /app/reports
│   │       ├── projects/page.tsx      ← /app/projects
│   │       └── fruits/
│   │           ├── page.tsx           ← /app/fruits 목록
│   │           ├── new/page.tsx
│   │           └── [fruitId]/
│   │               ├── page.tsx       ← /app/fruits/[id] 상세
│   │               └── edit/page.tsx
│   ├── (auth)/login/page.tsx          ← /login
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── fruits/route.ts
│       ├── fruits/[fruitId]/route.ts
│       ├── fruit-campaigns/route.ts
│       ├── fruit-campaigns/[campaignId]/route.ts
│       ├── fruit-tasks/route.ts
│       ├── fruit-tasks/[taskId]/route.ts
│       ├── fruit-performances/route.ts
│       └── fruit-insights/route.ts
├── components/app/
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   ├── FruitStatusBadge.tsx
│   ├── FruitCalendarBar.tsx
│   ├── CampaignTimeline.tsx
│   ├── MarginSummaryCard.tsx
│   ├── RiskAlertPanel.tsx
│   └── NextSeasonInsightCard.tsx
├── lib/
│   ├── auth.ts
│   ├── prisma.ts
│   ├── session.ts
│   ├── utils.ts
│   └── fruit-utils.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── middleware.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

---

## ★ 다음 할 일 (딸기 인터랙티브 UI)

딸기 상세 페이지에서 태스크 상태를 클릭 한 번으로 변경:
- API: PATCH /api/fruit-tasks/[taskId]
- Body: { "status": "done" } 또는 "in_progress", "pending"
- 상태 순환: pending → in_progress → done → pending

---

## ★ 핵심 파일 코드

### [FILE] middleware.ts
```typescript
import { auth } from "@/lib/auth";
export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  if (nextUrl.pathname.startsWith("/app") && !isLoggedIn)
    return Response.redirect(new URL("/login", nextUrl));
  if (nextUrl.pathname.startsWith("/login") && isLoggedIn)
    return Response.redirect(new URL("/app", nextUrl));
});
export const config = { matcher: ["/app/:path*", "/login"] };
```

### [FILE] lib/auth.ts
```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { z } from "zod";

function hashPassword(p: string) { return createHash("sha256").update(p).digest("hex"); }

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Credentials({
    credentials: { email: { type: "email" }, password: { type: "password" } },
    async authorize(credentials) {
      const parsed = z.object({ email: z.string().email(), password: z.string().min(4) }).safeParse(credentials);
      if (!parsed.success) return null;
      const user = await prisma.user.findUnique({ where: { email: parsed.data.email }, include: { workspace: true } });
      if (!user?.passwordHash || user.passwordHash !== hashPassword(parsed.data.password)) return null;
      return { id: user.id, email: user.email, name: user.name, role: user.role, workspaceId: user.workspaceId, workspaceName: user.workspace.name };
    },
  })],
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.id = user.id; token.role = (user as any).role; token.workspaceId = (user as any).workspaceId; token.workspaceName = (user as any).workspaceName; }
      return token;
    },
    async session({ session, token }) {
      if (token) { session.user.id = token.id as string; (session.user as any).role = token.role; (session.user as any).workspaceId = token.workspaceId; (session.user as any).workspaceName = token.workspaceName; }
      return session;
    },
  },
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
});
```

### [FILE] lib/prisma.ts
```typescript
import { PrismaClient } from "@prisma/client";
const g = globalThis as any;
export const prisma = g.prisma ?? new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["error","warn"] : ["error"] });
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
```

### [FILE] lib/session.ts
```typescript
import { auth } from "@/lib/auth";
import { apiError } from "@/lib/utils";
export interface SessionContext { userId: string; workspaceId: string; }
export async function requireSession(): Promise<{ ctx: SessionContext; error: null } | { ctx: null; error: Response }> {
  const session = await auth();
  const user = session?.user as any;
  if (!user?.id || !user?.workspaceId) return { ctx: null, error: apiError("Unauthorized", 401) };
  return { ctx: { userId: user.id, workspaceId: user.workspaceId }, error: null };
}
```

### [FILE] lib/utils.ts
```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...i: ClassValue[]) { return twMerge(clsx(i)); }
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleString("ko-KR", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
export const PRIORITY_LABELS: Record<string,string> = { critical:"긴급", high:"높음", medium:"중간", low:"낮음" };
export const PRIORITY_COLORS: Record<string,string> = { critical:"bg-red-100 text-red-700", high:"bg-orange-100 text-orange-700", medium:"bg-yellow-100 text-yellow-700", low:"bg-gray-100 text-gray-700" };
export const STATUS_COLORS: Record<string,string> = { draft:"bg-gray-100 text-gray-700", active:"bg-green-100 text-green-700", completed:"bg-green-100 text-green-700", done:"bg-green-100 text-green-700", in_progress:"bg-purple-100 text-purple-700", cancelled:"bg-red-100 text-red-700" };
export function apiError(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), { status, headers: { "Content-Type": "application/json" } });
}
export function apiResponse<T>(data: T, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
```

### [FILE] lib/fruit-utils.ts
```typescript
export type FruitPhase = "upcoming"|"preparing"|"sourcing"|"marketing"|"in_season"|"peak"|"closing"|"completed"|"delayed";
export const PHASE_LABELS: Record<FruitPhase,string> = { upcoming:"준비 전", preparing:"준비 중", sourcing:"소싱 중", marketing:"마케팅 준비", in_season:"판매 중", peak:"피크", closing:"마감", completed:"완료", delayed:"지연" };
export const PHASE_COLORS: Record<FruitPhase,string> = { upcoming:"bg-gray-100 text-gray-600", preparing:"bg-blue-100 text-blue-700", sourcing:"bg-blue-100 text-blue-700", marketing:"bg-orange-100 text-orange-700", in_season:"bg-green-100 text-green-700", peak:"bg-green-200 text-green-800", closing:"bg-amber-100 text-amber-700", completed:"bg-gray-100 text-gray-500", delayed:"bg-red-100 text-red-700" };
export const PHASE_BAR_COLORS: Record<FruitPhase,string> = { upcoming:"bg-gray-200", preparing:"bg-blue-300", sourcing:"bg-blue-500", marketing:"bg-orange-400", in_season:"bg-green-500", peak:"bg-green-600", closing:"bg-amber-400", completed:"bg-gray-300", delayed:"bg-red-500" };
export const CAMPAIGN_STATUS_LABELS: Record<string,string> = { draft:"초안", planned:"계획됨", active:"진행 중", completed:"완료", delayed:"지연" };
export const CAMPAIGN_STATUS_COLORS: Record<string,string> = { draft:"bg-gray-100 text-gray-600", planned:"bg-blue-100 text-blue-700", active:"bg-green-100 text-green-700", completed:"bg-gray-100 text-gray-500", delayed:"bg-red-100 text-red-700" };
export const TASK_TYPE_LABELS: Record<string,string> = { sourcing:"소싱", pricing:"가격", content:"콘텐츠", sales:"판매", review:"리뷰" };
export const TASK_TYPE_COLORS: Record<string,string> = { sourcing:"bg-indigo-100 text-indigo-700", pricing:"bg-cyan-100 text-cyan-700", content:"bg-orange-100 text-orange-700", sales:"bg-green-100 text-green-700", review:"bg-purple-100 text-purple-700" };
export const TASK_STATUS_LABELS: Record<string,string> = { pending:"대기", in_progress:"진행 중", done:"완료", delayed:"지연" };
export const TASK_STATUS_COLORS: Record<string,string> = { pending:"bg-gray-100 text-gray-600", in_progress:"bg-blue-100 text-blue-700", done:"bg-green-100 text-green-700", delayed:"bg-red-100 text-red-700" };
export const SEASON_LABELS: Record<string,string> = { spring:"봄", summer:"여름", autumn:"가을", winter:"겨울" };
export const CHANNEL_LABELS: Record<string,string> = { coupang:"쿠팡", marketkurly:"마켓컬리", smartstore:"스마트스토어", ssg:"SSG닷컴", oasis:"오아시스", direct:"자사몰" };

export function getCampaignPhase(c: { status:string; sourcingStartDate:Date|null; pricingDueDate:Date|null; contentDueDate:Date|null; launchDate:Date|null; promoPeakStartDate:Date|null; promoPeakEndDate:Date|null; reviewDate:Date|null }): FruitPhase {
  if (c.status==="completed") return "completed";
  if (c.status==="delayed") return "delayed";
  const now = new Date();
  if (c.promoPeakEndDate && now > c.promoPeakEndDate) return "closing";
  if (c.promoPeakStartDate && now >= c.promoPeakStartDate) return "peak";
  if (c.launchDate && now >= c.launchDate) return "in_season";
  if (c.contentDueDate && now >= c.contentDueDate) return "marketing";
  if (c.sourcingStartDate && now >= c.sourcingStartDate) return "sourcing";
  if (c.sourcingStartDate && now < c.sourcingStartDate) return "preparing";
  return "upcoming";
}
export function getFruitSeasonPhase(f: { seasonStartMonth:number; seasonEndMonth:number; peakStartMonth:number; peakEndMonth:number }): FruitPhase {
  const m = new Date().getMonth()+1;
  const inR = (s:number,e:number) => s<=e ? m>=s&&m<=e : m>=s||m<=e;
  if (inR(f.peakStartMonth,f.peakEndMonth)) return "peak";
  if (inR(f.seasonStartMonth,f.seasonEndMonth)) return "in_season";
  const mts = f.seasonStartMonth>m ? f.seasonStartMonth-m : 12-m+f.seasonStartMonth;
  return mts<=2 ? "preparing" : "upcoming";
}
export function hasDelayedTasks(tasks: { dueDate:Date|null; status:string }[]): boolean {
  const now = new Date();
  return tasks.some(t => t.dueDate && new Date(t.dueDate)<now && t.status!=="done");
}
export function formatKRW(n: number): string {
  if (n>=100000000) return `${(n/100000000).toFixed(1)}억원`;
  if (n>=10000) return `${(n/10000).toFixed(0)}만원`;
  return `${n.toLocaleString()}원`;
}
export function formatPct(v: number): string { return `${v.toFixed(1)}%`; }
```

### [FILE] app/api/auth/[...nextauth]/route.ts
```typescript
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

### [FILE] app/api/fruit-tasks/[taskId]/route.ts
```typescript
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["pending","in_progress","done","delayed"]).optional(),
  title: z.string().min(1).optional(),
  priority: z.enum(["low","medium","high","critical"]).optional(),
  notes: z.string().optional(),
  dueDate: z.string().optional().transform(v => v ? new Date(v) : undefined),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const { ctx, error } = await requireSession(req);
  if (error) return error;
  const { taskId } = await params;
  const existing = await prisma.fruitTask.findFirst({ where: { id: taskId, workspaceId: ctx.workspaceId } });
  if (!existing) return apiError("태스크를 찾을 수 없습니다.", 404);
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);
  const updated = await prisma.fruitTask.update({ where: { id: taskId }, data: parsed.data });
  return apiResponse(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const { ctx, error } = await requireSession(req);
  if (error) return error;
  const { taskId } = await params;
  const existing = await prisma.fruitTask.findFirst({ where: { id: taskId, workspaceId: ctx.workspaceId } });
  if (!existing) return apiError("태스크를 찾을 수 없습니다.", 404);
  await prisma.fruitTask.delete({ where: { id: taskId } });
  return new Response(null, { status: 204 });
}
```

---

## ★ Manus 전달 메시지 (복붙용)

```
MANUS_FULL_CONTEXT.md 파일을 전부 읽어줘.

파일들이 폴더 없이 개별 업로드됐으니 먼저 폴더 구조 확인:
- app/(app)/layout.tsx 존재하는지
- app/(app)/app/page.tsx 존재하는지  
- app/(auth)/login/page.tsx 존재하는지
- prisma/schema.prisma 존재하는지
- lib/fruit-utils.ts 존재하는지

경로 틀린 파일 있으면 올바른 위치로 이동시켜줘.
그 다음 순서대로 실행:
1. pnpm install
2. .env 설정 (DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL)
3. pnpm db:push
4. pnpm db:seed
5. pnpm dev

실행 확인 후, 딸기 상세 페이지에서
태스크 상태를 클릭 한 번으로 변경하는 인터랙티브 UI 구현해줘.
API: PATCH /api/fruit-tasks/[taskId]  body: { "status": "..." }
순환: pending → in_progress → done → pending
```
