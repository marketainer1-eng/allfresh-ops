import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { callClaudeJson } from "@/lib/marketing/claudeJson";

export const runtime = "nodejs";

interface StrategyInput {
    framework?: string;
    category?: string;
    content?: string;
    assignee?: string;
}
interface ContentPlanRequest {
    productName?: string;
    category?: string;
    targetCustomer?: string;
    marketingCopy?: string;
    seasonalCampaign?: string;
    hashtags?: string[];
    selectedStrategies?: StrategyInput[];
    additionalContext?: string;
}
interface ContentPlanItem {
    channel: string;
    title: string;
    description: string;
    keyPoints: string[];
    hashtags: string[];
}
interface ExecutionTaskItem {
    title: string;
    channel: string;
    description: string;
    priority: string;
    recommendedDate: string;
    assignee: string;
}
interface ContentPlanResponse {
    contentPlans: ContentPlanItem[];
    executionTasks: ExecutionTaskItem[];
}
const ALLOWED_CHANNELS = [
    "youtube_shorts",
    "instagram_reels",
    "instagram_feed",
    "naver_blog",
    "detail_copy",
    "promotion",
];
function buildPrompt(body: ContentPlanRequest): string {
    const strategiesText = (body.selectedStrategies || [])
        .map(
            (s, i) =>
                `${i + 1}. [${s.framework || "?"}/${s.category || "?"}] ${
                    s.content || ""
                }${s.assignee ? ` (담당: ${s.assignee})` : ""}`,
        )
        .join("\n");
    return `다음 과일 이커머스 상품의 확정된 마케팅 전략을 기반으로, 채널별 콘텐츠 기획안과 실행 플랜을 만들어 주세요.
상품명: ${body.productName || "(미입력)"}
카테고리: ${body.category || "single"} (single=단품, giftset=선물세트, subscription=구독)
타깃 고객: ${body.targetCustomer || "(미입력)"}
마케팅 카피: ${body.marketingCopy || "(미입력)"}
시즌 캠페인: ${body.seasonalCampaign || "(미입력)"}
기존 해시태그: ${(body.hashtags || []).join(", ") || "(없음)"}
확정된 전략 항목 (실행 대상):
${strategiesText || "(미입력)"}
${body.additionalContext?.trim() ? `추가 입력 데이터(반드시 반영): ${body.additionalContext.trim()}` : ""}
다음 JSON 형식으로 정확히 응답하세요. 모든 텍스트는 한국어로 작성합니다.
{
  "contentPlans": [
    { "channel": "youtube_shorts", "title": "...", "description": "...", "keyPoints": ["...","...","..."], "hashtags": ["#...","#..."] },
    { "channel": "instagram_reels", "title": "...", "description": "...", "keyPoints": ["..."], "hashtags": ["..."] },
    { "channel": "instagram_feed", "title": "...", "description": "...", "keyPoints": ["..."], "hashtags": ["..."] },
    { "channel": "naver_blog", "title": "...", "description": "...", "keyPoints": ["..."], "hashtags": ["..."] },
    { "channel": "detail_copy", "title": "...", "description": "...", "keyPoints": ["..."], "hashtags": ["..."] },
    { "channel": "promotion", "title": "...", "description": "...", "keyPoints": ["..."], "hashtags": ["..."] }
  ],
  "executionTasks": [
    { "title": "...", "channel": "youtube_shorts", "description": "...", "priority": "high", "recommendedDate": "ISO 8601 형식 (예: 2026-05-15T10:00:00Z)", "assignee": "" }
  ]
}
요구사항:
- contentPlans: 위 6개 channel을 모두 포함, 각 채널당 정확히 1건 (총 6건)
- keyPoints: 채널 특성에 맞춘 핵심 콘텐츠 포인트를 3~5개 작성
- executionTasks: 채널별 1~2개씩 총 8~12개의 실행 작업
- priority: 채널 도달력·전환 영향력·확정된 전략과의 연관도를 종합해 high/medium/low 판단
- recommendedDate: 오늘 기준으로 high는 3~10일 후, medium은 10~25일 후, low는 25~45일 후 사이로 분산. 같은 날짜에 너무 몰리지 않도록 1~3일 간격
- assignee: 확정된 전략 항목의 담당자 풀에서 채널·역할에 맞게 자동 매칭. 매칭이 어려우면 빈 문자열 ""`;
}
function generateMockPlans(body: ContentPlanRequest): ContentPlanResponse {
    const productName = body.productName || "상품";
    const productKey = productName.split(" ")[0] || productName;
    const targetCustomer = body.targetCustomer || "주요 타깃";
    const today = new Date();
    const addDays = (n: number): string => {
        const d = new Date(today);
        d.setDate(d.getDate() + n);
        d.setHours(10, 0, 0, 0);
        return d.toISOString();
    };
    const assigneePool = (body.selectedStrategies || [])
        .map((s) => (s.assignee || "").trim())
        .filter((a) => a.length > 0);
    const pickAssignee = (i: number): string =>
        assigneePool.length > 0 ? assigneePool[i % assigneePool.length] : "";
    const baseHashtag = `#${productKey}`;
    const baseTags = (body.hashtags || []).slice(0, 3);
    const contentPlans: ContentPlanItem[] = [
        {
            channel: "youtube_shorts",
            title: `${productName} 산지 직송 60초 비주얼 — '오늘 식탁'`,
            description:
                `이른 새벽 산지에서 식탁까지의 여정을 빠른 컷으로 보여주는 60초 영상. ${targetCustomer}의 일상 한 장면에 자연스럽게 안착시키는 컨셉입니다.`,
            keyPoints: [
                "오프닝(0~5초): 안개 낀 과수원 와이드샷 + 카운트다운 자막",
                "중반(5~30초): 수확 → 당도 측정 인서트 → 박스 포장 클로즈업",
                "후반(30~50초): 받는 고객 첫 입 리액션 + 가격/혜택 자막",
                "엔딩(50~60초): '오늘 밤, 식탁 위에' CTA + 한정 쿠폰 코드",
            ],
            hashtags: [
                baseHashtag,
                "#산지직송",
                "#쇼츠",
                "#과일추천",
                ...baseTags,
            ].slice(0, 6),
        },
        {
            channel: "instagram_reels",
            title: `${productName} 언박싱 ASMR — '한 입의 단맛'`,
            description:
                "포장을 풀고 한 입 베어 무는 순간까지를 ASMR로 담은 30초 릴스. 사운드 디자인으로 신선함을 전달합니다.",
            keyPoints: [
                "박스 개봉 사운드 → 과일 표면 클로즈업",
                "잘랐을 때의 단면·과즙 슬로 모션",
                "한 입 베어 무는 ASMR + 자막 카피",
                "스토리 전환: 'Brix 19' → '단맛 보장' 카드",
            ],
            hashtags: [baseHashtag, "#릴스", "#ASMR", "#한입", "#과일ASMR"],
        },
        {
            channel: "instagram_feed",
            title: `${productName} 큐레이션 무드 컷 5종 — 갤러리형 피드`,
            description:
                "프리미엄 분위기를 살린 정적 사진 5컷 시리즈. 식탁·홈파티·선물 등 사용 시나리오를 라이프스타일로 표현합니다.",
            keyPoints: [
                "1컷: 자연광 과수원 풍경 (브랜드 톤)",
                "2컷: 식탁 위 플레이팅 클로즈업",
                "3컷: 홈파티 무드 — 사람 손 인서트",
                "4컷: 선물 패키지 정면 컷",
                "5컷: 핵심 카피 + 구매 링크 카드",
            ],
            hashtags: [
                baseHashtag,
                "#피드",
                "#무드보드",
                "#프리미엄과일",
                "#홈파티",
            ],
        },
        {
            channel: "naver_blog",
            title: `${productName} 산지 탐방기 + 후기 통합 SEO 포스팅`,
            description:
                "검색 유입을 노린 2,000자 분량의 정보형 블로그 글. 산지·당도·보관법·후기 5건을 종합한 구성입니다.",
            keyPoints: [
                `도입: 검색 키워드 자연 노출 (예: '제철 ${productKey} 추천')`,
                "본문 1: 산지 탐방기 + 사진 6~8장",
                "본문 2: 당도/등급 등 객관 지표 표 정리",
                "본문 3: 보관법 / 활용 레시피 2가지",
                "마무리: 실제 후기 5건 인용 + 구매 CTA",
            ],
            hashtags: [
                baseHashtag,
                "#블로그",
                "#제철과일추천",
                "#산지직송리뷰",
            ],
        },
        {
            channel: "detail_copy",
            title: `${productName} 상세페이지 — '신뢰의 5단 구조'`,
            description:
                "스크롤 단계별로 신뢰감을 누적시키는 상세페이지 카피 구조. 첫 화면 후킹 → 객관 지표 → 후기 → CTA의 흐름입니다.",
            keyPoints: [
                "Hero 카피: 한 줄 후킹 + 가격/한정 정보",
                "신뢰 섹션: 산지·당도·등급 객관 지표 카드",
                "감성 섹션: 라이프스타일 사진 + 사용 시나리오",
                "사회적 증거: 후기 별점/문장 큐레이션",
                "전환 CTA: 한정 수량 알림 + 카트 담기 강조",
            ],
            hashtags: [baseHashtag, "#상세페이지", "#카피라이팅"],
        },
        {
            channel: "promotion",
            title: `${productName} 한정 런칭 위크 — '첫 구매 D-7 캠페인'`,
            description:
                "런칭 첫 7일 동안 운영하는 통합 프로모션 이벤트. 할인 + 굿즈 + 후기 챌린지를 묶어 초기 모멘텀을 만듭니다.",
            keyPoints: [
                "D-day~D+1: 첫 구매 15% 즉시 할인 쿠폰",
                "D+2~D+4: SNS 인증 시 사은품 (텀블러/에코백)",
                "D+5~D+7: 후기 챌린지 — 베스트 후기 3명 정기 배송권",
                "전 기간: 카카오 채널 친구 추가 시 5% 추가 할인",
                "리타깃팅: 장바구니 이탈자 대상 EDM 자동 발송",
            ],
            hashtags: [
                baseHashtag,
                "#런칭이벤트",
                "#한정프로모션",
                "#첫구매혜택",
            ],
        },
    ];
    const executionTasks: ExecutionTaskItem[] = [
        // High priority — 빠른 일정
        {
            title: "유튜브 쇼츠 스토리보드 + 촬영 일정 확정",
            channel: "youtube_shorts",
            description: "60초 컷 시퀀스, 자막 카피, 산지 촬영 일자/장비 리스트 확정",
            priority: "high",
            recommendedDate: addDays(3),
            assignee: pickAssignee(0),
        },
        {
            title: "상세페이지 카피 1차 드래프트 작성",
            channel: "detail_copy",
            description: "Hero/신뢰/감성/증거/CTA 5단 구조 카피라이팅",
            priority: "high",
            recommendedDate: addDays(4),
            assignee: pickAssignee(1),
        },
        {
            title: "런칭 위크 프로모션 사양서 확정",
            channel: "promotion",
            description: "할인율, 쿠폰 코드, 사은품 SKU, 카카오 채널 운영 룰 정의",
            priority: "high",
            recommendedDate: addDays(6),
            assignee: pickAssignee(2),
        },
        // Medium priority — 중간 일정
        {
            title: "인스타그램 릴스 ASMR 사운드 큐레이션 + 촬영",
            channel: "instagram_reels",
            description:
                "박스 개봉 / 슬라이스 / 한 입 베어무는 사운드 레퍼런스 수집 후 촬영",
            priority: "medium",
            recommendedDate: addDays(11),
            assignee: pickAssignee(3),
        },
        {
            title: "유튜브 쇼츠 1차 편집본 검수",
            channel: "youtube_shorts",
            description:
                "썸네일 3안 + 자막 검수 + A/B 테스트용 변형본 1종 추가",
            priority: "medium",
            recommendedDate: addDays(14),
            assignee: pickAssignee(0),
        },
        {
            title: "인스타 피드 무드 컷 5종 촬영",
            channel: "instagram_feed",
            description:
                "자연광 / 플레이팅 / 홈파티 / 선물 / CTA 카드 — 같은 톤으로 통일",
            priority: "medium",
            recommendedDate: addDays(17),
            assignee: pickAssignee(4),
        },
        {
            title: "상세페이지 디자인 — 카피 반영",
            channel: "detail_copy",
            description: "확정 카피를 디자인에 반영, 모바일 우선 검수",
            priority: "medium",
            recommendedDate: addDays(20),
            assignee: pickAssignee(1),
        },
        {
            title: "프로모션 EDM 발송 시나리오 세팅",
            channel: "promotion",
            description:
                "장바구니 이탈자 / 첫 구매 / 친구 추가 트리거별 EDM 자동화 룰 설정",
            priority: "medium",
            recommendedDate: addDays(23),
            assignee: pickAssignee(2),
        },
        // Low priority — 후순위
        {
            title: "네이버 블로그 산지 탐방 글 초안 작성",
            channel: "naver_blog",
            description: "2,000자 분량, 사진 6~8장, SEO 키워드 자연 배치",
            priority: "low",
            recommendedDate: addDays(28),
            assignee: pickAssignee(3),
        },
        {
            title: "후기 챌린지 운영 가이드 작성",
            channel: "promotion",
            description:
                "참여 룰 / 심사 기준 / 발표 일정 / 사은품 발송 프로세스 문서화",
            priority: "low",
            recommendedDate: addDays(33),
            assignee: pickAssignee(2),
        },
        {
            title: "네이버 블로그 발행 + 검색 노출 모니터링",
            channel: "naver_blog",
            description:
                "발행 후 24시간 / 72시간 / 1주일 시점 검색 순위 추적, 필요 시 키워드 보강",
            priority: "low",
            recommendedDate: addDays(40),
            assignee: pickAssignee(3),
        },
    ];
    return { contentPlans, executionTasks };
}

const CONTENT_PLANS_SCHEMA: Record<string, unknown> = {
    type: "object",
    additionalProperties: false,
    properties: {
        contentPlans: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                    channel: { type: "string", enum: ALLOWED_CHANNELS },
                    title: { type: "string" },
                    description: { type: "string" },
                    keyPoints: { type: "array", items: { type: "string" } },
                    hashtags: { type: "array", items: { type: "string" } },
                },
                required: ["channel", "title", "description", "keyPoints", "hashtags"],
            },
        },
        executionTasks: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                    title: { type: "string" },
                    channel: { type: "string", enum: ALLOWED_CHANNELS },
                    description: { type: "string" },
                    priority: { type: "string", enum: ["high", "medium", "low"] },
                    recommendedDate: { type: "string" },
                    assignee: { type: "string" },
                },
                required: [
                    "title",
                    "channel",
                    "description",
                    "priority",
                    "recommendedDate",
                    "assignee",
                ],
            },
        },
    },
    required: ["contentPlans", "executionTasks"],
};

function normalizeContentPlans(parsed: any): ContentPlanResponse | null {
    if (
        !Array.isArray(parsed.contentPlans) ||
        !Array.isArray(parsed.executionTasks)
    ) {
        return null;
    }
    const ensureArr = (v: unknown): string[] =>
        Array.isArray(v) ? v.map((x) => String(x)) : [];
    const contentPlans: ContentPlanItem[] = parsed.contentPlans.map(
        (p: any) => {
            const ch = ALLOWED_CHANNELS.includes(String(p?.channel))
                ? String(p.channel)
                : "detail_copy";
            return {
                channel: ch,
                title: String(p?.title || ""),
                description: String(p?.description || ""),
                keyPoints: ensureArr(p?.keyPoints),
                hashtags: ensureArr(p?.hashtags),
            };
        },
    );
    const allowedPriorities = ["high", "medium", "low"];
    const executionTasks: ExecutionTaskItem[] = parsed.executionTasks.map(
        (t: any, idx: number) => {
            let date = String(t?.recommendedDate || "");
            if (!date || isNaN(new Date(date).getTime())) {
                const d = new Date();
                d.setDate(d.getDate() + 7 + idx * 2);
                d.setHours(10, 0, 0, 0);
                date = d.toISOString();
            }
            const ch = ALLOWED_CHANNELS.includes(String(t?.channel))
                ? String(t.channel)
                : "detail_copy";
            const pr = allowedPriorities.includes(String(t?.priority))
                ? String(t.priority)
                : "medium";
            return {
                title: String(t?.title || ""),
                channel: ch,
                description: String(t?.description || ""),
                priority: pr,
                recommendedDate: date,
                assignee: String(t?.assignee || ""),
            };
        },
    );
    if (contentPlans.length === 0 || executionTasks.length === 0) return null;
    return { contentPlans, executionTasks };
}

export async function POST(req: NextRequest) {
    const { error } = await requireSession();
    if (error) return error;
    let body: ContentPlanRequest = {};
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    try {
        const prompt = buildPrompt(body);
        let result: ContentPlanResponse | null =
            await callClaudeJson<ContentPlanResponse>({
                system:
                    "당신은 한국 과일 이커머스 콘텐츠 마케팅 PM입니다. 반드시 유효한 JSON으로만 응답한다.",
                user: prompt,
                schema: CONTENT_PLANS_SCHEMA,
                normalize: normalizeContentPlans,
                maxTokens: 8000,
            });
        if (!result) {
            result = generateMockPlans(body);
        }
        return NextResponse.json(result);
    } catch (e) {
        console.error("generate-content-plans error:", e);
        return NextResponse.json(
            { error: e instanceof Error ? e.message : "Unknown error" },
            { status: 500 },
        );
    }
}
