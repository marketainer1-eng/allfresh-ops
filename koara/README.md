# KO A RA — 공식 홈페이지

> Personal Brand Archive + Official Entity Hub
> AI 이커머스 전문가 고아라(KO A RA)의 공식 홈페이지

**1차 골격 구축 단계입니다.** 전체 정보구조 · 페이지 구조 · 디자인 시스템 ·
반응형 레이아웃 · SEO/GEO 기술 기반이 완성되어 있고,
STORY / BOOKS / PROJECTS / MEDIA 의 세부 콘텐츠는 placeholder 상태입니다.

---

## ⚠️ 이 프로젝트의 위치

이 디렉터리는 상위 저장소(`allfresh-ops`) **안의 독립 Next.js 프로젝트**입니다.
상위 저장소는 전혀 다른 서비스(올프레쉬 OPS)이며, 이 작업은 상위 프로젝트의
파일을 **하나도 수정하지 않습니다.**

Vercel 배포 시 **Root Directory 를 `koara` 로 지정**하세요.

---

## 기술 스택

| 레이어 | 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router, Turbopack) |
| 언어 | TypeScript (strict) |
| 렌더링 | 전 페이지 SSG (정적 프리렌더) |
| 스타일 | Tailwind CSS v4 (CSS-first `@theme`) |
| 폰트 | Pretendard(CDN) + Noto Serif KR(Google Fonts) + 시스템 폰트 폴백 |
| 콘텐츠 | TypeScript 데이터 모듈 (`content/`) |

런타임 의존성은 `next` / `react` / `react-dom` 뿐입니다. UI 라이브러리를
쓰지 않아 클라이언트 JS 를 최소화했습니다.

---

## 로컬 실행

```bash
cd koara
npm install
npm run dev          # http://localhost:3000
```

## 빌드 · 검증

```bash
npm run build        # 프로덕션 빌드 (정적 생성)
npm run start        # 빌드 결과 실행
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
```

## 환경변수

| 변수 | 설명 |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | 배포 도메인. canonical / OG / sitemap / robots 에 사용. 미설정 시 `http://localhost:3000` |

`.env.example` 참고. 도메인이 확정되기 전까지 임의의 주소를 하드코딩하지 않았습니다.

---

## 폴더 구조

```
koara/
├─ app/                      # App Router — 라우트 = 폴더
│  ├─ layout.tsx             # 루트 레이아웃 · 폰트 · 전역 JSON-LD(Person·WebSite)
│  ├─ globals.css            # 디자인 시스템 (@theme 토큰)
│  ├─ page.tsx               # HOME (11개 섹션)
│  ├─ not-found.tsx          # 404
│  ├─ sitemap.ts             # sitemap.xml (콘텐츠 데이터에서 자동 생성)
│  ├─ robots.ts              # robots.txt
│  ├─ story/                 # /story, /story/[slug]
│  ├─ vision/                # /vision
│  ├─ books/                 # /books, /books/[slug]
│  ├─ projects/              # /projects, /projects/[slug]
│  ├─ media/                 # /media
│  └─ about/                 # /about
│
├─ components/               # 재사용 UI (데이터를 직접 알지 못함)
│  ├─ layout/                # SiteHeader · MobileNav · SiteFooter · PageHero
│  ├─ ui/                    # Container · Section · Button · Breadcrumbs · Placeholder
│  ├─ cards/                 # StoryCard · BookCard · ProjectCard · MediaCard
│  ├─ diagrams/              # PastTimeline · VerticalAiDiagram · ExpertIpDiagram
│  ├─ home/                  # HOME 섹션 조립
│  └─ seo/JsonLd.tsx
│
├─ content/                  # ★ 콘텐츠 데이터 (여기만 고치면 화면이 바뀐다)
│  ├─ types.ts               # 데이터 모델 정의
│  ├─ site.ts                # 사이트 설정 · 네비게이션 · 기본 SEO
│  ├─ person.ts              # Person Entity (정체성 원본)
│  ├─ home.ts                # PAST / PRESENT / ECOSYSTEM / FUTURE
│  ├─ redirects.ts           # 301 redirect 규칙
│  ├─ stories/index.ts
│  ├─ books/index.ts
│  ├─ projects/index.ts
│  └─ media/index.ts
│
└─ lib/
   ├─ seo.ts                 # buildMetadata() — title/description/canonical/OG/Twitter
   └─ schema.ts              # JSON-LD 빌더 (검증된 값만 출력)
```

**UI 와 데이터가 완전히 분리**되어 있어, 향후 CMS 를 붙일 때
`content/*` 의 로더만 교체하면 화면 코드는 그대로 동작합니다.

---

## 콘텐츠 추가 방법

| 하고 싶은 일 | 고칠 파일 |
|---|---|
| STORY 원고 작성 | `content/stories/index.ts` — `sections[].paragraphs` 채우고 `isPlaceholder: false` |
| 저서 등록 | `content/books/index.ts` — placeholder 를 실제 데이터로 교체 |
| 프로젝트 등록 | `content/projects/index.ts` — WHY/PROBLEM/BUILD/RESULT/NEXT 채우기 |
| 외부 채널 링크 연결 | `content/media/index.ts` 의 `externalUrl`, `content/person.ts` 의 `channels[].url` |
| 공식 URL 을 Schema 에 반영 | `content/person.ts` 의 `channels[].verified: true` |
| 기관 관계를 Schema 에 반영 | `content/person.ts` 의 `organizations.*` 에 추가 + `emitToSchema: true` |
| 메타 문구 교체 | `content/site.ts` |
| URL 변경 시 301 | `content/redirects.ts` |

새 STORY / BOOK / PROJECT 를 데이터에 추가하면
상세 페이지 · sitemap.xml · 내부 링크가 **다음 빌드에서 자동 반영**됩니다.

---

## 표기 규칙 (중요)

영문명은 어디서든 정확히 **`KO A RA`** 로 표기합니다.
(`KO ARA`, `KOARA`, `GO A RA` 등 변형 금지)

화면에 노출되는 모든 브랜드 표기는 `content/types.ts` 의 `BRAND_EN` 상수 →
`content/site.ts` 의 `site.brandEn` 을 통해서만 렌더됩니다.
문자열을 직접 쓰지 말고 이 상수를 사용하세요.

> 예외: npm 패키지명(`koara-site`)과 디렉터리명(`koara/`)은 대문자·공백을
> 쓸 수 없는 **기술 식별자**이며 화면 표기가 아닙니다.

---

## 데이터 원칙

이 사이트는 검증되지 않은 정보를 만들어내지 않습니다.

- 경력 · 수상 · 성과 · 수치를 임의로 작성하지 않습니다.
- `sameAs` 는 `verified: true` 이고 URL 이 있는 채널만 출력합니다.
- `affiliation` / `worksFor` / `memberOf` 는 `emitToSchema: true` 일 때만 출력합니다.
- `isPlaceholder: true` 인 책은 Book 구조화 데이터를 내보내지 않고
  sitemap 에서도 제외됩니다.
