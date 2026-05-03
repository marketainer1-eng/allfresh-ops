# 올프레쉬 OPS — MVP 1 개발자 핸드오프 문서

> **목적**: 정적 SPA 프로토타입을 Next.js 14 App Router + PostgreSQL + Prisma + NextAuth 스택으로 이전하기 위한 상세 핸드오프

---

## 1. 전략 요약 (≤10줄)

1. **진입점**: `index.html` (랜딩) → `app/login.html` → `app/index.html` (SPA 대시보드)
2. **핵심 흐름**: Login → Workspace → Org/Brand/Project → DiagnosisSession → Flow Input → Symptom Input → Evidence → Bottleneck Analysis → Top-3 → Ticket Draft → Recheck → Report
3. **병목 점수**: 심각도×4 + 빈도×3 + 에비던스×3(cap 15) + 비즈니스×4 = max 70점
4. **Top-k 집계**: `journey_step` 기준 그룹화 → 가중합 정렬 → 상위 3개 → 티켓 자동 생성
5. **프로토타입 데이터**: 브라우저 Table API (상대경로 `../tables/{table}`)
6. **프로덕션 전환**: Next.js Route Handlers → Prisma → PostgreSQL (Supabase 권장)
7. **인증**: 현재 localStorage 데모 → NextAuth.js (Credentials Provider → DB 검증)
8. **파일 스토리지**: 현재 UI만 → Supabase Storage (presigned URL 방식)
9. **우선순위**: Auth → CRUD API → Bottleneck Engine → Ticket Auto-gen → Report PDF
10. **브랜드 컬러**: `--brand: #008BCC`, `--brand-dark: #005A8E`, 폰트: Noto Sans KR

---

## 2. 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 App Router + TypeScript |
| 스타일링 | Tailwind CSS + shadcn/ui |
| 데이터베이스 | PostgreSQL (Supabase 권장) |
| ORM | Prisma 5 |
| 인증 | NextAuth.js v5 (Credentials) |
| 파일 스토리지 | Supabase Storage |
| 패키지 매니저 | pnpm |
| 차트 | Chart.js 4 / Recharts |

---

## 3. 파일 트리 (프로덕션)

```
allfresh-ops/
├── .env.local                    # 실제 환경변수
├── .env.example                  # 예시 (커밋 OK)
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
│
├── prisma/
│   ├── schema.prisma             # 전체 데이터 모델
│   └── seed.ts                   # 시드 데이터
│
├── public/
│   └── ...                       # 정적 에셋
│
├── app/
│   ├── layout.tsx                # Root layout (font, providers)
│   ├── page.tsx                  # 랜딩 페이지 (/) — 현재 index.html 이식
│   │
│   ├── app/                      # 인증 필요 영역
│   │   ├── layout.tsx            # Sidebar + Auth guard
│   │   ├── page.tsx              # /app → redirect /app/dashboard
│   │   ├── dashboard/page.tsx    # 대시보드
│   │   ├── projects/
│   │   │   ├── page.tsx          # 프로젝트 목록
│   │   │   └── [id]/page.tsx     # 프로젝트 상세
│   │   ├── sessions/
│   │   │   ├── page.tsx          # 세션 목록
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # 세션 상세 (redirect → diagnosis)
│   │   │       ├── diagnosis/page.tsx  # 7단계 진단 플로우
│   │   │       └── report/page.tsx     # 세션 리포트
│   │   ├── symptoms/page.tsx     # 증상 관리
│   │   ├── bottlenecks/page.tsx  # 병목 분석
│   │   ├── tickets/page.tsx      # 티켓 관리
│   │   ├── rechecks/page.tsx     # 재점검
│   │   └── reports/page.tsx      # 리포트 목록
│   │
│   ├── auth/
│   │   └── login/page.tsx        # 로그인 페이지
│   │
│   └── api/
│       ├── auth/[...nextauth]/route.ts    # NextAuth
│       ├── workspaces/route.ts
│       ├── organizations/route.ts
│       ├── projects/
│       │   ├── route.ts           # GET list, POST create
│       │   └── [id]/route.ts      # GET, PUT, DELETE
│       ├── sessions/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── customer-flows/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── symptoms/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── evidence/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── bottlenecks/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       │   └── analyze/route.ts   # POST → 병목 분석 실행
│       ├── tickets/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── rechecks/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── reports/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       └── upload/route.ts        # Supabase Storage presigned URL
│
├── components/
│   ├── ui/                        # shadcn/ui 컴포넌트
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopHeader.tsx
│   │   └── Breadcrumb.tsx
│   ├── diagnosis/
│   │   ├── DiagnosisStepper.tsx
│   │   ├── FlowInputStep.tsx
│   │   ├── SymptomInputStep.tsx
│   │   ├── EvidenceStep.tsx
│   │   ├── BottleneckStep.tsx
│   │   ├── TicketStep.tsx
│   │   ├── RecheckStep.tsx
│   │   └── ReportStep.tsx
│   ├── symptoms/
│   │   ├── SymptomCard.tsx
│   │   └── SymptomForm.tsx
│   ├── bottlenecks/
│   │   ├── BottleneckCard.tsx
│   │   └── ScoreChart.tsx
│   ├── tickets/
│   │   ├── TicketCard.tsx
│   │   └── TicketDetail.tsx
│   └── report/
│       └── ReportView.tsx
│
├── features/
│   ├── bottleneck/
│   │   ├── analyze.ts             # 핵심 분석 로직 (서버/클라이언트 공용)
│   │   └── generateTicket.ts      # 티켓 초안 생성
│   └── auth/
│       └── session.ts
│
└── lib/
    ├── prisma.ts                   # Prisma client singleton
    ├── auth.ts                     # NextAuth config
    ├── supabase.ts                 # Supabase Storage client
    └── utils.ts                    # 공통 유틸 (cn, formatters)
```

---

## 4. 병목 분석 핵심 로직

### 점수 산정 (`features/bottleneck/analyze.ts`)

```typescript
// 현재 프로토타입: app/js/bottleneck.js 에 구현 완료
// 프로덕션 전환 시 TypeScript로 이식

interface ScoringWeights {
  severity: 4;       // max 20
  frequency: 3;      // max 15
  evidence: 3;       // max 15 (cap)
  businessImpact: 4; // max 20
}
// 최대 70점

function calcScore(symptom: Symptom): number {
  return (
    symptom.severity      * 4 +
    symptom.frequency     * 3 +
    Math.min(symptom.evidenceCount * 3, 15) +
    symptom.businessImpact * 4
  );
}

function analyzeBottlenecks(symptoms: Symptom[], topN = 3): Bottleneck[] {
  // 1. journey_step 기준 그룹화
  const groups = groupBy(symptoms, s => s.journeyStep);
  
  // 2. 그룹별 집계
  const bottlenecks = Object.entries(groups).map(([step, syms]) => ({
    journeyStep: step,
    totalScore: sum(syms.map(calcScore)),
    severityScore: avg(syms.map(s => s.severity * 4)),
    frequencyScore: avg(syms.map(s => s.frequency * 3)),
    evidenceScore: Math.min(sum(syms.map(s => s.evidenceCount * 3)), 15),
    businessImpactScore: avg(syms.map(s => s.businessImpact * 4)),
    symptomCount: syms.length,
    topTags: getTopTags(syms, 4),
    symptoms: syms,
  }));
  
  // 3. 정렬 → Top-N
  return bottlenecks
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, topN)
    .map((bn, i) => ({ ...bn, rank: i + 1, label: makeLabel(bn) }));
}
```

### 티켓 자동 생성 (`features/bottleneck/generateTicket.ts`)

```typescript
// journey_step 별 액션/성공지표 매핑 → generateTicketDraft(bottleneck)
// 현재 app/js/bottleneck.js 의 generateTicketDraft() 참조
```

---

## 5. API 엔드포인트 설계

### 핵심 엔드포인트

```
# Projects
GET    /api/projects?workspaceId=&page=&limit=&search=
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id

# Diagnosis Sessions
GET    /api/sessions?projectId=&status=&page=&limit=
POST   /api/sessions
GET    /api/sessions/:id
PATCH  /api/sessions/:id   { status }
DELETE /api/sessions/:id

# Customer Flows
GET    /api/customer-flows?sessionId=
POST   /api/customer-flows
DELETE /api/customer-flows/:id

# Symptoms
GET    /api/symptoms?sessionId=&channel=&journeyStep=&page=&limit=
POST   /api/symptoms
PATCH  /api/symptoms/:id
DELETE /api/symptoms/:id

# Evidence Items
GET    /api/evidence?symptomId=&sessionId=
POST   /api/evidence           multipart/form-data → upload → Supabase
DELETE /api/evidence/:id

# Bottleneck Analysis
GET    /api/bottlenecks?sessionId=
POST   /api/bottlenecks/analyze { sessionId, topN? }  ← 분석 실행 + 저장

# Ticket Drafts
GET    /api/tickets?sessionId=&status=
POST   /api/tickets
PATCH  /api/tickets/:id        { status: 'confirmed' | ... }
DELETE /api/tickets/:id

# Rechecks
GET    /api/rechecks?sessionId=&ticketId=
POST   /api/rechecks
PATCH  /api/rechecks/:id       { result, metricAfter }

# Reports
GET    /api/reports?sessionId=&projectId=
POST   /api/reports
GET    /api/reports/:id
PATCH  /api/reports/:id        { status: 'published' }

# Upload
POST   /api/upload  → returns { url, path }
```

---

## 6. Prisma 스키마 요약

> 전체 스키마: `prisma/schema.prisma` 참조

핵심 모델 관계:
```
Workspace → Organization → Project → DiagnosisSession
DiagnosisSession → CustomerFlow (ordered steps)
DiagnosisSession → Symptom → EvidenceItem
DiagnosisSession → Bottleneck (from analysis)
Bottleneck ← TicketDraft → Recheck → Report
```

---

## 7. NextAuth 설정

```typescript
// lib/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async ({ email, password }) => {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        const valid = await bcrypt.compare(password, user.passwordHash);
        return valid ? { id: user.id, name: user.name, email: user.email, role: user.role } : null;
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) { token.id = user.id; token.role = user.role; }
      return token;
    },
    session: async ({ session, token }) => {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      return session;
    },
  },
  pages: { signIn: "/auth/login" },
});
```

---

## 8. 환경변수 (`env.example`)

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/allfresh_ops"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-min-32-chars"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

---

## 9. 완료 기준 체크리스트

- [ ] `pnpm install` 성공
- [ ] `pnpm prisma migrate dev` 성공 (DB 생성)
- [ ] `pnpm prisma db seed` 성공 (데모 계정 + 샘플 데이터)
- [ ] `pnpm dev` → http://localhost:3000 랜딩 페이지 표시
- [ ] `/auth/login` → admin@allfresh.co.kr / admin1234 로그인 성공
- [ ] `/app/dashboard` → 대시보드 통계 카드 표시
- [ ] 프로젝트 생성 → 진단 세션 생성 → `/app/sessions/{id}/diagnosis` 진입
- [ ] STEP 1~7 순서로 진행 가능
- [ ] STEP 4 병목 분석 → Top-3 카드 + 차트 표시
- [ ] STEP 5 티켓 초안 자동 생성
- [ ] `/app/sessions/{id}/report` → 전체 리포트 + 인쇄 버튼 동작

---

## 10. 현재 프로토타입에서 참조할 파일

| 프로토타입 파일 | 이식 대상 |
|----------------|----------|
| `app/js/bottleneck.js` | `features/bottleneck/analyze.ts` |
| `app/js/utils.js` | `lib/utils.ts` + `components/` |
| `app/css/app.css` | `tailwind.config.ts` + `globals.css` |
| `app/index.html` (JS 로직) | 각 page.tsx + 서버 컴포넌트 |
| `app/diagnosis.html` (스테퍼) | `app/app/sessions/[id]/diagnosis/page.tsx` |
| `app/report.html` | `app/app/sessions/[id]/report/page.tsx` |
| `prisma/schema.prisma` | 그대로 사용 |
| `prisma/seed.ts` | 그대로 사용 |

---

*작성일: 2026-04-23 | 버전: MVP 1.0 | 담당: 올프레쉬 개발팀*
