import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { callClaudeJson } from "@/lib/marketing/claudeJson";

export const runtime = "nodejs";

interface ScheduleRequest {
    productName?: string;
    category?: string;
    targetCustomer?: string;
    marketingCopy?: string;
    seasonalCampaign?: string;
    shippingDate?: string;
}
interface ScheduleItem {
    title: string;
    description: string;
    channel: string;
    phase: string;
    daysBefore: number;
}
interface ScheduleResponse {
    items: ScheduleItem[];
}
const ALLOWED_CHANNELS = ["SNS", "EDM", "BANNER", "BLOG"];
const ALLOWED_PHASES = [
    "preorder",
    "teaser",
    "awareness",
    "countdown",
    "launch",
    "retention",
];
function buildPrompt(body: ScheduleRequest): string {
    return `과일 출하일을 D-Day로 정해, 그 날짜를 기준으로 역산한 선행 마케팅 일정을 추천해 주세요.
상품명: ${body.productName || "(미입력)"}
카테고리: ${body.category || "single"} (single=단품, giftset=선물세트, subscription=구독)
타깃 고객: ${body.targetCustomer || "(미입력)"}
마케팅 카피: ${body.marketingCopy || "(미입력)"}
시즌 캠페인: ${body.seasonalCampaign || "(미입력)"}
출하일(D-Day): ${body.shippingDate || "(미입력)"}
다음 JSON 형식으로 정확히 응답하세요. 모든 텍스트는 한국어로 작성합니다.
{
  "items": [
    { "title": "...", "description": "...", "channel": "BANNER", "phase": "preorder", "daysBefore": 30 }
  ]
}
요구사항:
- phase: preorder(사전 예약) | teaser(티저) | awareness(본격 광고) | countdown(카운트다운) | launch(출하 D-Day) | retention(리텐션) 중 하나
- channel: SNS | EDM | BANNER | BLOG 중 하나
- daysBefore 권장 범위:
  • preorder: 21 ~ 35
  • teaser: 14 ~ 21
  • awareness: 7 ~ 14
  • countdown: 1 ~ 7
  • launch: 0 (정확히 0)
  • retention: -7 ~ -1 (출하 후이므로 음수)
- 항목 수: 총 10~14개. 각 phase당 1~3개씩 골고루 분배(launch는 정확히 1개)
- title은 30자 이내, description은 80자 이내로 구체적이고 실행 가능한 문장
- 같은 phase 안에서도 daysBefore가 겹치지 않도록 1~3일 간격으로 분산
- 단품은 신선도, 선물세트는 격식·예약, 구독은 정기성·무료체험에 맞춘 카피 톤을 사용`;
}
function generateMockSchedule(body: ScheduleRequest): ScheduleResponse {
    const productName = body.productName || "상품";
    const category = body.category || "single";
    const items: ScheduleItem[] = [
        {
            title: `${productName} 사전 예약 페이지 오픈`,
            description: "한정 수량 사전 예약 + 첫 구매 5% 즉시 할인 혜택 노출",
            channel: "BANNER",
            phase: "preorder",
            daysBefore: 30,
        },
        {
            title: "VIP 고객 사전 예약 EDM 발송",
            description: "기존 구매·정기 구독자 대상 우선 예약 + 한정 굿즈 안내",
            channel: "EDM",
            phase: "preorder",
            daysBefore: 28,
        },
        {
            title: "산지 직송 인스타 릴스 티저 공개",
            description: "수확 직전 과수원 풍경 + 카운트다운 자막의 30초 릴스",
            channel: "SNS",
            phase: "teaser",
            daysBefore: 21,
        },
        {
            title: "산지 탐방기 블로그 SEO 포스팅",
            description: "당도·등급·산지 데이터를 담은 2,000자 정보형 글 발행",
            channel: "BLOG",
            phase: "teaser",
            daysBefore: 18,
        },
        {
            title: "퍼포먼스 광고 본격 집행",
            description: "메타·구글 ROAS 캠페인 시작, 핵심 타깃 1차 노출 확보",
            channel: "SNS",
            phase: "awareness",
            daysBefore: 14,
        },
        {
            title: "메인 배너 + 카테고리 톱 노출",
            description: "올프레쉬 메인·카테고리 톱 배너에 비주얼 키컷 노출",
            channel: "BANNER",
            phase: "awareness",
            daysBefore: 10,
        },
        {
            title: "카운트다운 D-7 EDM",
            description: "출하 D-7 알림 + 장바구니 이탈 고객 리타깃 쿠폰",
            channel: "EDM",
            phase: "countdown",
            daysBefore: 7,
        },
        {
            title: "인스타 라이브 D-3 + 한정 쿠폰",
            description: "산지 PD 라이브 + 라이브 시청자 한정 10% 즉시 할인",
            channel: "SNS",
            phase: "countdown",
            daysBefore: 3,
        },
        {
            title: "출하 직전 D-1 푸시 + EDM",
            description: "내일 도착 안내 + 미예약 고객 대상 마지막 알림",
            channel: "EDM",
            phase: "countdown",
            daysBefore: 1,
        },
        {
            title: `${productName} 출하 시작 SNS 인증 이벤트`,
            description: "출하 첫 날 도착 사진 인증 시 추가 할인 쿠폰 자동 발급",
            channel: "SNS",
            phase: "launch",
            daysBefore: 0,
        },
        {
            title: "출하 후 후기 모집 EDM",
            description: "구매자 사진 후기 모집, 베스트 후기 3명 정기 배송권 증정",
            channel: "EDM",
            phase: "retention",
            daysBefore: -3,
        },
        {
            title: "재구매 유도 + 정기구독 전환 EDM",
            description: "1차 구매 고객 대상 정기구독 5% 추가 할인 코드 발송",
            channel: "EDM",
            phase: "retention",
            daysBefore: -7,
        },
    ];
    if (category === "giftset") {
        items[0].title = `${productName} 선물세트 사전 예약 오픈`;
        items[0].description = "법인·VIP 우선 예약 + 인쇄·리본 옵션 안내";
        items[1].title = "법인 답례 견적 EDM 발송";
        items[1].description = "총무팀 대상 명절 답례 패키지 견적 자동 발송";
    } else if (category === "subscription") {
        items[0].title = `${productName} 신규 정기구독 캠페인 오픈`;
        items[0].description = "첫 회 50% + 2주 무료 체험 신규 가입 캠페인";
        items[1].title = "기존 회원 추천 코드 EDM";
        items[1].description = "친구 초대 시 양쪽 모두 5,000원 적립 안내";
    }
    return { items };
}

const SHIPPING_SCHEDULE_SCHEMA: Record<string, unknown> = {
    type: "object",
    additionalProperties: false,
    properties: {
        items: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    channel: { type: "string", enum: ALLOWED_CHANNELS },
                    phase: { type: "string", enum: ALLOWED_PHASES },
                    daysBefore: { type: "number" },
                },
                required: ["title", "description", "channel", "phase", "daysBefore"],
            },
        },
    },
    required: ["items"],
};

function normalizeSchedule(parsed: any): ScheduleResponse | null {
    if (!Array.isArray(parsed.items)) return null;
    const items: ScheduleItem[] = parsed.items.map((it: any) => {
        const ch = ALLOWED_CHANNELS.includes(String(it?.channel))
            ? String(it.channel)
            : "SNS";
        const ph = ALLOWED_PHASES.includes(String(it?.phase))
            ? String(it.phase)
            : "awareness";
        const days = Number(it?.daysBefore);
        return {
            title: String(it?.title || ""),
            description: String(it?.description || ""),
            channel: ch,
            phase: ph,
            daysBefore: isNaN(days) ? 7 : days,
        };
    });
    if (items.length === 0) return null;
    return { items };
}

export async function POST(req: NextRequest) {
    const { error } = await requireSession();
    if (error) return error;
    let body: ScheduleRequest = {};
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    try {
        const prompt = buildPrompt(body);
        let result: ScheduleResponse | null =
            await callClaudeJson<ScheduleResponse>({
                system:
                    "당신은 한국 과일 이커머스 출하 마케팅 PM입니다. 반드시 유효한 JSON으로만 응답한다.",
                user: prompt,
                schema: SHIPPING_SCHEDULE_SCHEMA,
                normalize: normalizeSchedule,
                maxTokens: 4000,
            });
        if (!result) {
            result = generateMockSchedule(body);
        }
        return NextResponse.json(result);
    } catch (e) {
        console.error("generate-shipping-schedule error:", e);
        return NextResponse.json(
            { error: e instanceof Error ? e.message : "Unknown error" },
            { status: 500 },
        );
    }
}
