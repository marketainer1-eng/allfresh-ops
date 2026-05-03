# 올프레쉬 OPS — 과일 중심 이커머스 운영 플랫폼

> **Fruit-centric eCommerce Operations Platform**  
> 시즌이 아닌 **과일(딸기·포도·망고·수박·귤·복숭아)**을 1차 엔티티로 삼아  
> 소싱 → 가격 → 콘텐츠 → 판매 → 성과 → 내년 전략까지 전 사이클을 관리합니다.

---

## 🏗 기술 스택

| 레이어 | 기술 |
|---|---|
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript |
| UI | Tailwind CSS |
| ORM | Prisma (PostgreSQL) |
| 인증 | NextAuth.js (Credentials) |
| 아이콘 | lucide-react |

---

## 🚀 빠른 시작

```bash
# 1. 의존성 설치
pnpm install

# 2. 환경 변수 설정 (.env.example 참고)
cp .env.example .env
# DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL 입력

# 3. DB 스키마 적용
pnpm db:push

# 4. 시드 데이터 삽입 (과일 6종 + 캠페인 + 성과 + 태스크)
pnpm db:seed

# 5. 개발 서버 시작
pnpm dev
```

**기본 계정 (시드 후 사용 가능):**
| 이메일 | 비밀번호 | 역할 |
|---|---|---|
| admin@allfresh.co.kr | admin1234 | 관리자 |
| sales@allfresh.co.kr | sales1234 | 영업 매니저 |
| ops@allfresh.co.kr | ops1234 | 운영 팀원 |

---

## 🗂 프로젝트 구조

```
app/
├── (auth)/login/           # 로그인 페이지
├── (app)/
│   └── app/
│       ├── page.tsx        # 과일 포트폴리오 대시보드
│       ├── fruits/
│       │   ├── page.tsx          # 과일 목록
│       │   ├── new/page.tsx      # 과일 신규 등록
│       │   └── [fruitId]/
│       │       ├── page.tsx      # 과일 상세
│       │       └── edit/page.tsx # 과일 편집
│       ├── calendar/page.tsx     # Gantt형 연간 과일 캘린더
│       ├── campaigns/
│       │   ├── page.tsx          # 캠페인 목록
│       │   └── [campaignId]/page.tsx # 캠페인 상세
│       ├── reports/page.tsx      # 성과 리포트
│       ├── projects/             # 고객경험 진단 프로젝트
│       └── diagnosis/            # 진단 세션 (기존 유지)
├── api/
│   ├── fruits/route.ts           # GET, POST
│   ├── fruits/[fruitId]/route.ts # GET, PATCH, DELETE
│   ├── fruit-campaigns/route.ts  # GET, POST
│   ├── fruit-campaigns/[campaignId]/route.ts # GET, PATCH, DELETE
│   ├── fruit-tasks/route.ts      # GET, POST
│   ├── fruit-tasks/[taskId]/route.ts        # GET, PATCH, DELETE
│   ├── fruit-performances/route.ts          # GET, POST
│   ├── fruit-insights/route.ts              # GET, POST
│   └── fruit-insights/[insightId]/route.ts # GET, PATCH, DELETE
└── page.tsx                # 퍼블릭 랜딩 페이지

components/app/
├── Sidebar.tsx             # 사이드바 네비게이션
├── Header.tsx              # 상단 헤더
├── FruitStatusBadge.tsx    # 과일 페이즈 배지 컴포넌트
├── FruitCalendarBar.tsx    # 연중 시즌 바 컴포넌트
├── CampaignTimeline.tsx    # 캠페인 타임라인 컴포넌트
├── MarginSummaryCard.tsx   # 마진 요약 카드 컴포넌트
├── RiskAlertPanel.tsx      # 지연 리스크 알림 패널
└── NextSeasonInsightCard.tsx # 내년 시즌 인사이트 카드

lib/
├── fruit-utils.ts          # 과일 비즈니스 로직 (Phase 계산, 포맷터)
├── auth.ts                 # NextAuth 설정
├── prisma.ts               # Prisma 클라이언트
├── session.ts              # requireSession 헬퍼
└── utils.ts                # cn, formatDate 등

prisma/
├── schema.prisma           # 전체 데이터 모델
└── seed.ts                 # 시드 스크립트
```

---

## 📊 데이터 모델

### 핵심 과일 모델

```
Fruit
├── id, workspaceId, name, variety, category, emoji
├── seasonStartMonth, seasonEndMonth  (1-12)
├── peakStartMonth, peakEndMonth
├── sourcingLeadDays, marketingLeadDays  (자동 리드타임 계산)
├── defaultChannels[]
├── priorityLevel (1=낮음, 2=중간, 3=높음)
└── isActive

FruitCampaign  ← Fruit에 연결
├── year, season (spring/summer/autumn/winter)
├── title, status (draft/planned/active/completed/delayed)
├── sourcingStartDate, pricingDueDate, contentDueDate
├── launchDate, promoPeakStartDate, promoPeakEndDate, reviewDate
└── ownerId, notes

FruitPerformance  ← Fruit + FruitCampaign에 연결
├── channel, salesAmount, marginAmount, marginRate
├── csCount, returnRate, conversionRate
├── reviewSummary, nextAction

FruitTask  ← Fruit + FruitCampaign에 연결
├── type (sourcing/pricing/content/sales/review)
├── title, assigneeId, dueDate
└── status (pending/in_progress/done/delayed), priority

FruitInsight  ← Fruit + FruitCampaign에 연결
├── sourceYear, summary, recommendation
└── linkedToNextCampaign (bool)
```

### 기존 진단 모델 (유지)
- `Workspace → User → Organization → Project → DiagnosisSession`
- `CustomerFlow, Symptom, EvidenceItem, Bottleneck, TicketDraft, Recheck, Report`

---

## 🔌 API 엔드포인트 목록

### 과일 (Fruits)
| Method | Path | 설명 |
|---|---|---|
| GET | `/api/fruits` | 과일 목록 (isActive, category 필터) |
| POST | `/api/fruits` | 과일 생성 |
| GET | `/api/fruits/:id` | 과일 상세 (캠페인·성과·태스크·인사이트 포함) |
| PATCH | `/api/fruits/:id` | 과일 수정 |
| DELETE | `/api/fruits/:id` | 과일 삭제 |

### 캠페인 (FruitCampaigns)
| Method | Path | 설명 |
|---|---|---|
| GET | `/api/fruit-campaigns` | 캠페인 목록 (fruitId, year, status 필터) |
| POST | `/api/fruit-campaigns` | 캠페인 생성 |
| GET | `/api/fruit-campaigns/:id` | 캠페인 상세 |
| PATCH | `/api/fruit-campaigns/:id` | 캠페인 수정 |
| DELETE | `/api/fruit-campaigns/:id` | 캠페인 삭제 |

### 태스크 (FruitTasks)
| Method | Path | 설명 |
|---|---|---|
| GET | `/api/fruit-tasks` | 태스크 목록 (fruitId, status, overdue 필터) |
| POST | `/api/fruit-tasks` | 태스크 생성 |
| GET | `/api/fruit-tasks/:id` | 태스크 상세 |
| PATCH | `/api/fruit-tasks/:id` | 태스크 상태/날짜 수정 |
| DELETE | `/api/fruit-tasks/:id` | 태스크 삭제 |

### 성과 (FruitPerformances)
| Method | Path | 설명 |
|---|---|---|
| GET | `/api/fruit-performances` | 성과 목록 (fruitId, channel 필터) |
| POST | `/api/fruit-performances` | 성과 등록 |

### 인사이트 (FruitInsights)
| Method | Path | 설명 |
|---|---|---|
| GET | `/api/fruit-insights` | 인사이트 목록 (fruitId, linked 필터) |
| POST | `/api/fruit-insights` | 인사이트 생성 |
| GET | `/api/fruit-insights/:id` | 인사이트 상세 |
| PATCH | `/api/fruit-insights/:id` | 인사이트 수정 |
| DELETE | `/api/fruit-insights/:id` | 인사이트 삭제 |

---

## 🎯 비즈니스 로직

### Phase 자동 계산 (`lib/fruit-utils.ts`)

| Phase | 조건 |
|---|---|
| `upcoming` | 소싱 시작일 이전 |
| `preparing` | 시즌 시작 2달 이내 |
| `sourcing` | 소싱 시작 후 |
| `marketing` | 콘텐츠 완료일 이후 |
| `in_season` | 런칭일 이후 |
| `peak` | 피크 구간 내 |
| `closing` | 피크 종료 이후 |
| `completed` | 캠페인 status = completed |
| `delayed` | 캠페인 status = delayed |

### 리드타임 자동 계산
- **소싱 시작일** = 제철 시작일 − `sourcingLeadDays`
- **마케팅 준비일** = 런칭일 − `marketingLeadDays`

### 리스크 감지
- `dueDate < now && status !== done` → 지연 태스크 플래그
- 대시보드·캘린더·과일 상세에서 빨간 배지로 강조 표시

---

## 📱 페이지별 기능 요약

### `/` — 랜딩 페이지
- 과일 포트폴리오 미리보기 (6종)
- C1·C2·C3 재해석 섹션
- 5단계 운영 방식 설명

### `/app` — 과일 포트폴리오 대시보드
- 지금 판매 중인 과일 / 준비 중인 과일
- 지연 리스크 알림 패널
- 전체 과일 카드 그리드 (Phase·마진·태스크 표시)
- 다음 30일 액션 + 작년 성과→올해 전략

### `/app/fruits` — 과일 목록
- 카드형 목록 (Gantt 미니바·성과·캠페인)
- phase/risk 필터

### `/app/fruits/new` — 과일 등록
- 이모지 선택, 품종·카테고리, 시즌 월 설정
- 리드타임 설정, 채널 선택

### `/app/fruits/[fruitId]` — 과일 상세
- 시즌 타임라인, 캠페인 목록, 태스크 현황
- 채널별 성과, 인사이트, 연도별 비교

### `/app/fruits/[fruitId]/edit` — 과일 편집
- 기본정보·시즌·리드타임·채널 PATCH

### `/app/calendar` — 과일 캘린더
- Gantt형 연간 뷰, 제철·소싱·마케팅·판매 구간 표시

### `/app/campaigns` — 캠페인 목록
- 연도별 그룹화, Phase·리스크 표시

### `/app/campaigns/[id]` — 캠페인 상세
- 마일스톤 타임라인, 태스크, 채널 성과, 인사이트

### `/app/reports` — 성과 리포트
- KPI 요약 (매출·마진·전환·CS)
- 과일별 매출 순위 바 차트
- 채널별 합산 성과
- 과일별 상세 성과 카드
- 내년 시즌 연결 인사이트

---

## 🌱 시드 데이터

`pnpm db:seed` 실행 시 삽입되는 기본 데이터:

**과일 6종:** 딸기(설향), 포도(샤인머스캣), 망고(애플망고), 수박, 귤(한라봉·천혜향), 복숭아(백도·황도)

**캠페인 6건:** 딸기 2026 겨울(active), 포도 2026 추석(planned), 망고 2026 여름(planned), 수박 2026 여름(planned), 귤 2025 겨울(completed), 딸기 2025 겨울(completed)

**성과 4건:** 딸기×쿠팡, 딸기×마켓컬리, 귤×쿠팡, 포도×마켓컬리

**태스크 14건:** 지연·진행 중·대기 혼합 (망고 소싱 태스크 = 의도적 지연)

**인사이트 3건:** 딸기·포도·귤 (딸기·포도 = linkedToNextCampaign: true)

---

## ⚠️ 기능 범위 및 우선순위

### 🍓 핵심 기능 (과일 포트폴리오 운영)
이 플랫폼의 **주 목적**은 과일 중심 이커머스 운영입니다.
- `/app` 진입 시 과일 포트폴리오 대시보드가 기본 화면
- 사이드바 상단 그룹 "과일 운영": 대시보드 → 과일 포트폴리오 → 과일 캘린더 → 캠페인 관리 → 성과 리포트
- 삭제된 루트 정적 파일: `calendar.html`, `fruit-calendar-2026.html`, `index.html` (기능은 Next.js 앱으로 완전 이전)

### 🔬 보조 기능 (고객경험 진단)
사이드바 하단 그룹 "고객경험 진단"의 `진단 프로젝트` 메뉴는 **기존 시스템 유지** 목적의 보조 기능입니다.
- 과일 운영과 독립적으로 동작하며 신규 기능 개발 우선순위는 낮음
- 관련 라우트: `/app/projects`, `/app/diagnosis`

---

## 🖥 브라우저 검증 흐름

```
1. http://localhost:3000 → 랜딩 페이지 확인
2. /login → admin@allfresh.co.kr / admin1234 로그인
3. /app → 과일 포트폴리오 대시보드 (시즌 과일, 준비 과일, 리스크 패널 확인)
4. /app/fruits → 과일 목록 (6종 카드, 필터 동작 확인)
5. /app/fruits/[딸기 ID] → 딸기 상세 (시즌바, 캠페인, 태스크, 성과 확인)
6. /app/fruits/[망고 ID] → 망고 상세 (지연 태스크 빨간 표시 확인)
7. /app/calendar → Gantt 연간 캘린더 (6종 바 표시 확인)
8. /app/campaigns → 캠페인 목록 (연도별 그룹, 상태 배지 확인)
9. /app/reports → 성과 리포트 (KPI 카드, 과일별 매출, 채널별 성과 확인)
```

---

## 🗺 남은 개발 과제

- [ ] 과일 상세 → 캠페인 신규 생성 UI (모달/인라인 폼)
- [ ] 태스크 인라인 상태 변경 (체크박스 클릭)
- [ ] 성과 인라인 등록 폼 (과일 상세 내)
- [ ] 캘린더 연도 전환 필터 (2025/2026/2027)
- [ ] 채널 필터 (상단 바 구현)
- [ ] 리포트 차트 시각화 (Chart.js 연동)
- [ ] 알림 시스템 (마감 D-7 자동 알림)
- [ ] 내보내기 (CSV/PDF 리포트)

---

## 📁 참고 파일

`ref/` 폴더에는 기획 참고용 원본 자료가 보관됩니다.
- `ref/2026과일캘린더.csv` — 2026 과일 운영 캘린더 원본 CSV (EUC-KR, 기획용)

---

---

## 🎬 데모 집중 범위 (미팅용)

| 과일 | 시즌 | 핵심 스토리 |
|---|---|---|
| 🍓 딸기(설향) | 12월~5월 | 2025 포장 CS 61% → 2026 박스 리뉴얼 + 선물세트 신규 |
| 🍇 샤인머스캣 | 8월~11월 | 2025 마진율 27% / 품절 2회 → 2026 물량 30% 증편 |
| 🥭 망고(애플망고) | 6월~9월 | 제주 농장 계약 지연 → 소싱 리스크 빨간색 표시 |

### 화면별 핵심 UX
- **대시보드 `/app`**: 지금 집중해야 할 과일 순 정렬 + 지연 리스크 배너
- **캘린더 `/app/calendar`**: Gantt 타임라인 + 현재 단계 마일스톤 체크리스트
- **과일 상세 `/app/fruits/[id]`**: 지연 알림 → 작년/올해 인사이트 → 채널 성과 → 태스크 스토리 연결
- **리포트 `/app/reports`**: 2025 KPI → 과일별 매출 바 → 채널 집계 → 2026 실행 계획 카드

---

*올프레쉬 OPS v2.1 — Demo-Ready Build*  
*마지막 업데이트: 2026-04-24*
