import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { callClaudeJson } from "@/lib/marketing/claudeJson";

export const runtime = "nodejs";

interface StrategyRequest {
    productName?: string;
    category?: string;
    targetCustomer?: string;
    marketingCopy?: string;
    seasonalCampaign?: string;
    productInfo?: string;
    additionalContext?: string;
}
interface StrategyResponse {
    swot: {
        strength: string[];
        weakness: string[];
        opportunity: string[];
        threat: string[];
    };
    pest: {
        political: string[];
        economic: string[];
        social: string[];
        technological: string[];
    };
}
function buildPrompt(body: StrategyRequest): string {
    return `다음 과일 이커머스 상품 데이터를 바탕으로 SWOT 분석과 PEST 분석을 실시해 주세요.
상품명: ${body.productName || "(미입력)"}
카테고리: ${body.category || "single"} (single=단품, giftset=선물세트, subscription=구독)
타깃 고객: ${body.targetCustomer || "(미입력)"}
마케팅 카피: ${body.marketingCopy || "(미입력)"}
시즌 캠페인: ${body.seasonalCampaign || "(미입력)"}
상품 설명: ${body.productInfo || "(미입력)"}
${body.additionalContext?.trim() ? `추가 입력 데이터(반드시 반영): ${body.additionalContext.trim()}` : ""}
다음 JSON 형식으로 정확히 응답해 주세요. 각 항목은 한국어로 3개씩, 실행 가능한 구체적 문장으로 작성하세요.
{
  "swot": {
    "strength": ["강점 1", "강점 2", "강점 3"],
    "weakness": ["약점 1", "약점 2", "약점 3"],
    "opportunity": ["기회 1", "기회 2", "기회 3"],
    "threat": ["위협 1", "위협 2", "위협 3"]
  },
  "pest": {
    "political": ["정치 환경 1", "정치 환경 2", "정치 환경 3"],
    "economic": ["경제 환경 1", "경제 환경 2", "경제 환경 3"],
    "social": ["사회 환경 1", "사회 환경 2", "사회 환경 3"],
    "technological": ["기술 환경 1", "기술 환경 2", "기술 환경 3"]
  }
}`;
}
function generateMockStrategy(body: StrategyRequest): StrategyResponse {
    const category = body.category || "single";
    const productName = body.productName || "상품";
    if (category === "giftset") {
        return {
            swot: {
                strength: [
                    `${productName}의 큐레이션된 구성으로 객단가 향상`,
                    "프리미엄 패키지로 격식 있는 브랜드 이미지 구축",
                    "B2B(법인 답례품) 채널 확장 용이",
                ],
                weakness: [
                    "명절·시즌 의존도가 높아 매출 편중",
                    "포장재·인쇄 비용 부담",
                    "예약판매·재고 운영 복잡",
                ],
                opportunity: [
                    "ESG 트렌드로 친환경 패키지 수요 증가",
                    "법인·관공서 비대면 답례 문화 정착",
                    "VIP·프리미엄 선물 시장 확대",
                ],
                threat: [
                    "청탁금지법 영향으로 고가 선물 위축",
                    "백화점·전문 선물 브랜드와의 경쟁 심화",
                    "물류 피크 시기 배송 지연 리스크",
                ],
            },
            pest: {
                political: [
                    "청탁금지법(김영란법) 가액 한도 변동 영향",
                    "공정거래·소비자보호 규제 강화 흐름",
                    "친환경 포장재 의무화 정책 확대 가능성",
                ],
                economic: [
                    "기업 복리후생 예산 변동성 확대",
                    "환율 변동에 따른 수입 자재 비용 영향",
                    "프리미엄 소비 양극화 심화",
                ],
                social: [
                    "MZ 세대의 가치 소비·친환경 선호 강화",
                    "비대면 선물·디지털 카드 결합 트렌드",
                    "1인 가구 증가로 소형 선물세트 수요 확대",
                ],
                technological: [
                    "QR 카드·디지털 메시지 등 IT 결합 패키지 가능",
                    "물류 AI 추적 시스템으로 배송 신뢰도 향상",
                    "단체 주문 자동화 솔루션으로 B2B 처리 효율화",
                ],
            },
        };
    }
    if (category === "subscription") {
        return {
            swot: {
                strength: [
                    "정기 결제로 안정적인 매출 예측 가능",
                    "고객 데이터 축적으로 큐레이션 정교화",
                    "신규 제철 과일 노출로 브랜드 충성도 강화",
                ],
                weakness: [
                    "초기 구독 전환율이 낮아 마케팅 비용 부담",
                    "이탈(churn) 관리 운영 리소스 필요",
                    "단품·세트 대비 객단가 낮을 수 있음",
                ],
                opportunity: [
                    "구독 경제 시장 지속 성장",
                    "오피스·복지몰 B2B 정기 공급 확장",
                    "AI 추천 기반 개인화 큐레이션 강화",
                ],
                threat: [
                    "쿠팡·마켓컬리 등 대형 D2C 가격 경쟁",
                    "구독 피로도로 인한 이탈 가속",
                    "농산물 가격 변동에 따른 마진 리스크",
                ],
            },
            pest: {
                political: [
                    "정기결제·구독 약관 규제 강화",
                    "개인정보보호법 등 데이터 활용 규제",
                    "농산물 직거래·로컬푸드 정책 활용 기회",
                ],
                economic: [
                    "가처분소득 변동으로 정기 지출 항목 재검토",
                    "구독 경제 시장 연 20%대 성장 흐름",
                    "원가 변동에 따른 가격 정책 압박",
                ],
                social: [
                    "건강 관리 루틴화 트렌드 — 비타민·과일 정기 섭취",
                    "오피스 복지 다양화로 B2B 수요 증가",
                    "환경·로컬 가치 중심 소비 확대",
                ],
                technological: [
                    "AI 추천 알고리즘으로 큐레이션 자동화",
                    "결제·배송 자동화 SaaS 활용 용이",
                    "고객 행동 분석을 통한 이탈 예측 모델 구축",
                ],
            },
        };
    }
    // single (default)
    return {
        swot: {
            strength: [
                `${productName} 산지 직송으로 신선도와 품질이 우수함`,
                "당도·등급 등 객관적 품질 지표 보유",
                "한정 제철 시기로 희소성·프리미엄 포지셔닝 가능",
            ],
            weakness: [
                "제철 외 기간에는 매출 변동성이 큼",
                "냉장 유통 필수로 물류 비용 부담",
                "단품 위주라 객단가 향상 한계",
            ],
            opportunity: [
                "프리미엄 과일에 대한 1인 가구·MZ 수요 증가",
                "선물용·홈파티 수요 확대",
                "산지직송 라이브커머스로 신뢰도 강화 가능",
            ],
            threat: [
                "기후변화로 인한 작황 불안정",
                "대형 유통사의 PB 프리미엄 과일 진출",
                "수입 과일 가격 경쟁 심화",
            ],
        },
        pest: {
            political: [
                "정부의 농산물 직거래 활성화 정책 수혜",
                "원산지 표기 강화 규제로 신뢰성 부각 기회",
                "FTA 확대에 따른 수입 과일 관세 영향",
            ],
            economic: [
                "고물가로 인한 프리미엄 농산물 가격 저항",
                "1인 가구 증가로 소포장 수요 확대",
                "물류·인건비 상승으로 마진 압박",
            ],
            social: [
                "건강·웰빙 트렌드로 신선 과일 수요 지속",
                "비건·로컬푸드 관심 증가",
                "선물 문화 변화 — 실용·소량 선호",
            ],
            technological: [
                "AI 기반 수확/품질 예측 시스템 도입 가능",
                "콜드체인 기술 발전으로 신선도 유지 향상",
                "라이브커머스·SNS 마케팅 인프라 성숙",
            ],
        },
    };
}

const STRING_ARRAY = { type: "array", items: { type: "string" } };
const STRATEGY_SCHEMA: Record<string, unknown> = {
    type: "object",
    additionalProperties: false,
    properties: {
        swot: {
            type: "object",
            additionalProperties: false,
            properties: {
                strength: STRING_ARRAY,
                weakness: STRING_ARRAY,
                opportunity: STRING_ARRAY,
                threat: STRING_ARRAY,
            },
            required: ["strength", "weakness", "opportunity", "threat"],
        },
        pest: {
            type: "object",
            additionalProperties: false,
            properties: {
                political: STRING_ARRAY,
                economic: STRING_ARRAY,
                social: STRING_ARRAY,
                technological: STRING_ARRAY,
            },
            required: ["political", "economic", "social", "technological"],
        },
    },
    required: ["swot", "pest"],
};

function normalizeStrategy(parsed: any): StrategyResponse | null {
    if (!parsed.swot || !parsed.pest) return null;
    const ensureArr = (v: any) => Array.isArray(v) ? v.map(String) : [];
    return {
        swot: {
            strength: ensureArr(parsed.swot.strength),
            weakness: ensureArr(parsed.swot.weakness),
            opportunity: ensureArr(parsed.swot.opportunity),
            threat: ensureArr(parsed.swot.threat),
        },
        pest: {
            political: ensureArr(parsed.pest.political),
            economic: ensureArr(parsed.pest.economic),
            social: ensureArr(parsed.pest.social),
            technological: ensureArr(parsed.pest.technological),
        },
    };
}

export async function POST(req: NextRequest) {
    const { error } = await requireSession();
    if (error) return error;
    let body: StrategyRequest = {};
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    try {
        const prompt = buildPrompt(body);
        let result: StrategyResponse | null = await callClaudeJson<StrategyResponse>({
            system:
                "당신은 한국 과일 이커머스 전략 컨설턴트입니다. 반드시 유효한 JSON으로만 응답한다.",
            user: prompt,
            schema: STRATEGY_SCHEMA,
            normalize: normalizeStrategy,
            maxTokens: 4000,
        });
        if (!result) {
            result = generateMockStrategy(body);
        }
        return NextResponse.json(result);
    } catch (e) {
        console.error("analyze-strategy error:", e);
        return NextResponse.json(
            { error: e instanceof Error ? e.message : "Unknown error" },
            { status: 500 },
        );
    }
}
