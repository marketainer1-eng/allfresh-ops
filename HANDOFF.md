# 올프레쉬 OPS — Manus 인수인계 문서

> **작성일**: 2026-04-26  
> **현재 상태**: Genspark에서 코드 작성 완료 → Manus에서 실행 + 기능 추가 예정  
> **목적**: 딸기/망고/샤인머스캣 3개 과일 실데이터 기반 미팅 데모

---

## 1. 프로젝트 개요

**올프레쉬 OPS** — 과일 중심 이커머스 운영 플랫폼  
시즌이 아닌 **과일을 1차 엔티티**로 삼아 소싱 → 가격 → 콘텐츠 → 판매 → 성과 → 내년 전략까지 전 사이클 관리

### 기술 스택
| 레이어 | 기술 |
|---|---|
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript |
| UI | Tailwind CSS |
| ORM | Prisma |
| DB | PostgreSQL (Supabase 권장) |
| 인증 | NextAuth.js v5 (Credentials) |
| 아이콘 | lucide-react |
| 패키지 매니저 | pnpm |

---

## 2. 즉시 실행 방법

```bash
# 1. 의존성 설치
pnpm install

# 2. 환경변수 설정
cp .env.example .env
# .env 파일에서 아래 3개 반드시 입력:
# DATABASE_URL="postgresql://..."   ← Supabase 또는 로컬 PostgreSQL
# AUTH_SECRET="랜덤32자"            ← openssl rand -base64 32
# NEXTAUTH_URL="http://localhost:3000"

# 3. DB 스키마 적용
pnpm db:push

# 4. 시드 데이터 삽입 (딸기/망고/샤인머스캣 실데이터)
pnpm db:seed

# 5. 개발 서버 시작
pnpm dev
```

### 기본 로그인 계정
| 이메일 | 비밀번호 | 역할 |
|---|---|---|
| admin@allfresh.co.kr | admin1234 | 관리자 (주 사용) |
| sales@allfresh.co.kr | sales1234 | 영업 매니저 |
| ops@allfresh.co.kr | ops1234 | 운영 팀원 |

---

## 3. 현재 완성된 파일 목록

### 핵심 페이지 (4개)
```
app/(app)/app/page.tsx                    ✅ 대시보드 — 3개 과일 현황·리스크·액션
app/(app)/app/calendar/page.tsx           ✅ 연간 캘린더 — Gantt + 마일스톤 체크리스트
app/(app)/app/fruits/[fruitId]/page.tsx   ✅ 과일 상세 — 스토리형 (작년→올해 연결)
app/(app)/app/reports/page.tsx            ✅ 성과 리포트 — 2025결과→2026액션 연결
```

### 과일 목록·등록·편집
```
app/(app)/app/fruits/page.tsx             ✅ 과일 목록 (3개 필터)
app/(app)/app/fruits/new/page.tsx         ✅ 과일 신규 등록
app/(app)/app/fruits/[fruitId]/edit/page.tsx ✅ 과일 편집
```

### 캠페인
```
app/(app)/app/campaigns/page.tsx          ✅ 캠페인 목록
app/(app)/app/campaigns/[campaignId]/page.tsx ✅ 캠페인 상세
```

### API 라우트 (전체 CRUD 완성)
```
app/api/fruits/route.ts                        ✅ GET, POST
app/api/fruits/[fruitId]/route.ts              ✅ GET, PATCH, DELETE
app/api/fruit-campaigns/route.ts               ✅ GET, POST
app/api/fruit-campaigns/[campaignId]/route.ts  ✅ GET, PATCH, DELETE
app/api/fruit-tasks/route.ts                   ✅ GET, POST
app/api/fruit-tasks/[taskId]/route.ts          ✅ GET, PATCH, DELETE
app/api/fruit-performances/route.ts            ✅ GET, POST
app/api/fruit-insights/route.ts                ✅ GET, POST
app/api/fruit-insights/[insightId]/route.ts    ✅ GET, PATCH, DELETE
```

### 공용 컴포넌트
```
components/app/Sidebar.tsx              ✅ 사이드바 (과일 운영 주, 진단 후순위)
components/app/Header.tsx               ✅ 상단 헤더
components/app/FruitStatusBadge.tsx     ✅ 페이즈 배지
components/app/FruitCalendarBar.tsx     ✅ 연중 시즌 바
components/app/CampaignTimeline.tsx     ✅ 캠페인 타임라인
components/app/MarginSummaryCard.tsx    ✅ 마진 요약 카드
components/app/RiskAlertPanel.tsx       ✅ 지연 리스크 패널
components/app/NextSeasonInsightCard.tsx ✅ 내년 인사이트 카드
```

### 비즈니스 로직
```
lib/fruit-utils.ts    ✅ Phase 계산, 포맷터, 상수 맵 전체
lib/auth.ts           ✅ NextAuth 설정
lib/prisma.ts         ✅ Prisma 클라이언트
lib/session.ts        ✅ requireSession 헬퍼
lib/utils.ts          ✅ cn, formatDate 등
```

### 데이터
```
prisma/schema.prisma  ✅ 전체 스키마 (Fruit, FruitCampaign, FruitTask, FruitPerformance, FruitInsight)
prisma/seed.ts        ✅ 딸기/망고/샤인머스캣 실데이터 시드
```

---

## 4. 시드 데이터 내용 (핵심)

### 🍓 딸기 (설향)
- **2025 시즌 (completed)**: 쿠팡 4,850만원/마진20%, 마켓컬리 3,120만원/마진18%, 스마트스토어 1,890만원
- **2026 시즌 (active)**: 현재 판매 중. 상세페이지 리뉴얼 진행 중
- **핵심 스토리**: 2025 포장 CS 14건(61%) → 2026 에어캡 박스 교체 + 선물세트 2종 신규
- **태스크**: 소싱 완료·가격 확정 완료 / 상세페이지 리뉴얼 진행 중 / 마켓컬리 입점 협의 대기

### 🥭 망고 (애플망고)
- **2026 시즌 (planned)**: 소싱 지연 리스크 상태
- **핵심 스토리**: 제주 JM농장 계약 협의 중단 → 10일 초과 지연 → 대체 농장 긴급 탐색
- **태스크**: "제주 JM농장 대체 농장 긴급 탐색" — 10일 초과 (빨간 배지)

### 🍇 샤인머스캣
- **2025 시즌 (completed)**: 마켓컬리 5,500만원/마진27%, SSG 2,800만원/마진26%
- **2026 시즌 (planned)**: 선물세트 전략 강화 기획 중
- **핵심 스토리**: 2025 추석 선물세트 품절 2회(기회손실 800만원) → 2026 물량 30% 증편 + 선물세트 3종

---

## 5. 데이터 모델 요약

```
Fruit
├── id, workspaceId, name, variety, category, emoji
├── seasonStartMonth, seasonEndMonth (1-12)
├── peakStartMonth, peakEndMonth
├── sourcingLeadDays, marketingLeadDays
├── defaultChannels[]
└── priorityLevel (1~3), isActive

FruitCampaign → Fruit
├── year, season (spring/summer/autumn/winter)
├── title, status (draft/planned/active/completed/delayed)
├── sourcingStartDate, pricingDueDate, contentDueDate
├── launchDate, promoPeakStartDate, promoPeakEndDate, reviewDate
└── ownerId, notes

FruitTask → Fruit + FruitCampaign
├── type (sourcing/pricing/content/sales/review)
├── title, dueDate, status, priority
└── notes

FruitPerformance → Fruit + FruitCampaign
├── channel (coupang/marketkurly/smartstore/ssg/...)
├── salesAmount, marginAmount, marginRate
├── csCount, returnRate, conversionRate
└── reviewSummary, nextAction

FruitInsight → Fruit + FruitCampaign
├── sourceYear, summary, recommendation
└── linkedToNextCampaign (bool)
```

---

## 6. Phase 자동 계산 로직 (`lib/fruit-utils.ts`)

```
getCampaignPhase(campaign) 함수:
- completed  → "완료"
- delayed    → "지연"
- now > promoPeakEndDate   → "마감"
- now >= promoPeakStartDate → "피크"
- now >= launchDate         → "판매 중"
- now >= contentDueDate     → "마케팅 준비"
- now >= sourcingStartDate  → "소싱 중"
- now < sourcingStartDate   → "준비 중"
```

---

## 7. 남은 작업 (Manus에서 할 것)

### 🔴 최우선 — 딸기 운영 흐름 인터랙티브화
지금 딸기 상세 페이지에서 각 단계를 **직접 클릭해서 진행**할 수 있어야 함.

**구현 목표:**
```
딸기 상세 (/app/fruits/[fruitId])
  ↓ 클릭
소싱 단계 카드
  → 소싱 시작일 확인/수정
  → 산지 계약 태스크 상태 변경 (pending → in_progress → done)
  → 메모 입력
  ↓ 완료 체크 → 다음 단계로 자동 이동
가격 단계 카드
  → 채널별 판매가 입력 (쿠팡/컬리/스마트스토어)
  → 마진율 자동 계산
  ↓
콘텐츠 단계 카드
  → 상세페이지 체크리스트 (신선도 인증/포장 사진/키워드)
  ↓
판매 단계 카드
  → 채널별 매출 입력
  → CS 건수 기록
  ↓
성과·인사이트 카드
  → 이번 시즌 요약 입력
  → 내년 반영 포인트 자동 연결
```

### 🟡 중요 — 태스크 인라인 상태 변경
- 체크박스 클릭 → `PATCH /api/fruit-tasks/[id]` → 즉시 상태 변경
- 새로고침 없이 UI 업데이트

### 🟡 중요 — 캘린더 연도 전환 필터
- 2025 / 2026 / 2027 탭 전환

### 🟢 선택 — 성과 인라인 등록
- 과일 상세 내에서 채널별 성과 직접 입력 폼

### 🟢 선택 — Chart.js 시각화
- 리포트 페이지 매출 바 차트 → Chart.js 실제 렌더링

---

## 8. 환경변수 설명

```env
DATABASE_URL="postgresql://postgres:PASSWORD@db.XXXXX.supabase.co:5432/postgres"
# Supabase → Project Settings → Database → Connection string → URI

AUTH_SECRET="랜덤32자문자열"
# 터미널에서: openssl rand -base64 32

NEXTAUTH_URL="http://localhost:3000"
# 배포 시: https://your-domain.vercel.app
```

---

## 9. 배포 옵션

### Vercel + Supabase (권장)
```
1. supabase.com → 새 프로젝트 → DATABASE_URL 복사
2. github.com → 코드 push
3. vercel.com → GitHub 연결 → 환경변수 3개 입력
4. 배포 완료 후 터미널에서: pnpm db:seed
```

### 로컬 개발
```
PostgreSQL 설치 → .env 설정 → pnpm db:push → pnpm db:seed → pnpm dev
```

---

## 10. 주요 URL 맵

| URL | 설명 |
|---|---|
| `/` | 랜딩 페이지 |
| `/login` | 로그인 |
| `/app` | 🍓🥭🍇 과일 포트폴리오 대시보드 |
| `/app/fruits` | 과일 목록 (3종) |
| `/app/fruits/[id]` | 과일 상세 (스토리형) |
| `/app/fruits/[id]/edit` | 과일 편집 |
| `/app/fruits/new` | 과일 신규 등록 |
| `/app/calendar` | 연간 Gantt 캘린더 |
| `/app/campaigns` | 캠페인 목록 |
| `/app/campaigns/[id]` | 캠페인 상세 |
| `/app/reports` | 성과 리포트 (2025→2026) |

---

## 11. 데모 시나리오 (미팅용 순서)

```
① http://localhost:3000 → 랜딩 (과일 중심 운영 소개)
② /login → admin@allfresh.co.kr / admin1234
③ /app → 대시보드
   - 망고 빨간 리스크 배너 확인 ("JM농장 계약 중단 — 10일 초과")
   - 딸기 active 상태 + 다음 액션 확인
   - 2025→2026 인사이트 요약 카드
④ /app/fruits/[딸기ID] → 딸기 상세
   - 2025 성과 확인 (포장 CS 61%)
   - 2026 반영 내용 확인 (에어캡 박스 교체)
   - 채널별 성과 (쿠팡 4,850만원 / 컬리 3,120만원)
   - 태스크 현황 (완료·진행·대기)
⑤ /app/fruits/[망고ID] → 망고 상세
   - 빨간 리스크 알림 최상단 표시
   - 이유 상세 확인
⑥ /app/fruits/[샤인머스캣ID] → 샤인머스캣 상세
   - 마진율 27% 강조
   - 2026 선물세트 전략
⑦ /app/calendar → Gantt 캘린더
   - 현재 시점 빨간 선
   - 각 과일 마일스톤 체크리스트
⑧ /app/reports → 성과 리포트
   - 2025 KPI 요약
   - 채널별 집계
   - 2026 실행 계획 카드 3종
```

---

*올프레쉬 OPS — Manus Handoff Document*  
*Genspark 작업 완료 기준: 2026-04-26*
