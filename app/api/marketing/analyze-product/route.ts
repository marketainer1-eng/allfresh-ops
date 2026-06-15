import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { callClaudeJson } from "@/lib/marketing/claudeJson";

export const runtime = "nodejs";

interface MarketResearchInput {
    summary?: string;
    results?: Array<{ title?: string; url?: string; snippet?: string }>;
}
interface CompetitorInput {
    name?: string;
    priceRange?: string;
    strengths?: string;
}
interface WeatherInput {
    baseDate?: string;
    baseTime?: string;
    temperature?: number | null;
    rainfall?: number | null;
    humidity?: number | null;
}
interface KamisPriceItem {
    itemname?: string;
    item_name?: string;
    kindname?: string;
    kind_name?: string;
    countyname?: string;
    county_name?: string;
    regday?: string;
    date?: string;
    price?: string;
    dpr1?: string;
}
interface KamisPricesInput {
    mapping?: {
        productName?: string;
        categoryName?: string;
        itemName?: string;
        kindName?: string;
    } | null;
    period?: { startday?: string; endday?: string };
    items?: KamisPriceItem[];
}
interface AnalyzeRequest {
    category?: string;
    inputMode?: string;
    productName?: string;
    productInfo?: string;
    sourceUrl?: string;
    fileName?: string;
    attributes?: {
        sweetness?: string;
        origin?: string;
        season?: string;
        storage?: string;
        grade?: string;
        fruitType?: string;
    };
    competitors?: CompetitorInput[];
    marketResearch?: MarketResearchInput | null;
    weather?: WeatherInput | null;
    kamisPrices?: KamisPricesInput | null;
}
interface ChannelRecommendation {
    channel: string;
    priority: "high" | "medium" | "low";
    reasoning: string;
}
interface AnalyzeResponse {
    targetCustomer: string;
    marketingCopy: string;
    seoKeywords: string[];
    seasonalCampaign: string;
    hashtags: string[];
    pricePositioning: string;
    differentiation: string;
    recommendedChannels: ChannelRecommendation[];
}
// 과일별 고유 특성 — AI 분석에 자동 반영되는 마케팅 차별화 데이터
const FRUIT_CHARACTERISTICS: Record<string, {
    features: string[];
    sellingPoints: string[];
    competitors: string[];
    typicalPriceRange: string;
}> = {
    "샤인머스켓": {
        features: ["씨 없음", "껍질째 먹기 가능", "머스켓 향", "아삭한 식감", "큰 알"],
        sellingPoints: ["프리미엄 디저트 과일", "선물용 최적", "아이도 안전하게 즐김"],
        competitors: ["거봉포도", "캠벨얼리", "청포도", "수입 톰슨시들리스"],
        typicalPriceRange: "2만 원 ~ 5만 원/2kg",
    },
    "딸기": {
        features: ["겨울 제철", "비타민C 풍부", "디저트·베이킹 활용", "향이 강함"],
        sellingPoints: ["아이 간식", "베이킹·카페 재료", "비주얼 활용도 높음"],
        competitors: ["수입 베리류", "냉동 딸기", "블루베리"],
        typicalPriceRange: "1만 원 ~ 2만 5천 원/750g",
    },
    "대저 짭짤이 토마토": {
        features: ["짭짤한 맛(소금기)", "단맛+짠맛 밸런스", "겨울~봄 한정", "리코펜 풍부"],
        sellingPoints: ["건강 다이어트 과채", "지역 특산물", "와인·치즈 페어링"],
        competitors: ["일반 방울토마토", "수입 토마토", "대추방울토마토"],
        typicalPriceRange: "1만 5천 원 ~ 3만 원/2kg",
    },
    "금실 딸기": {
        features: ["고당도 프리미엄 딸기", "쫀득한 과육", "진한 향", "크기가 큼"],
        sellingPoints: ["프리미엄 선물용 딸기", "디저트·호텔용", "카페 활용"],
        competitors: ["설향 딸기", "죽향 딸기", "일반 딸기"],
        typicalPriceRange: "2만 원 ~ 4만 원/750g",
    },
    "망고": {
        features: ["진한 단맛", "열대 향", "비타민A 풍부", "주스·스무디 활용"],
        sellingPoints: ["이국적인 디저트", "여름 시즌 카페 재료", "주스용"],
        competitors: ["파인애플", "아보카도", "국산 애플망고"],
        typicalPriceRange: "2만 원 ~ 5만 원/2kg",
    },
    "멜론": {
        features: ["풍부한 과즙", "향긋한 향", "큰 사이즈", "단일 선물용"],
        sellingPoints: ["고급 선물용", "명절 답례품", "여름 시그니처"],
        competitors: ["수박", "머스크멜론", "하미과"],
        typicalPriceRange: "2만 원 ~ 4만 원/통",
    },
    "애플망고": {
        features: ["붉은 껍질", "제주산 국내 생산", "진한 단맛", "부드러운 식감"],
        sellingPoints: ["프리미엄 국산 망고", "여름 선물", "디저트·카페"],
        competitors: ["수입 망고", "복숭아", "천도복숭아"],
        typicalPriceRange: "3만 원 ~ 7만 원/2kg",
    },
    "블루베리": {
        features: ["안토시아닌 풍부", "눈 건강 효능", "냉동 보관 가능", "베이킹 활용"],
        sellingPoints: ["건강 간식", "시리얼·요거트 토핑", "아이 간식"],
        competitors: ["수입 블루베리", "라즈베리", "냉동 베리믹스"],
        typicalPriceRange: "1만 5천 원 ~ 3만 원/500g",
    },
};
function formatFruitContext(fruitType?: string): string {
    if (!fruitType) return "(과일 종류 미지정 - 일반 단품 과일로 분석)";
    const c = FRUIT_CHARACTERISTICS[fruitType];
    if (!c) return `(${fruitType} - 등록된 특성 데이터 없음, 일반 특성 기반 분석)`;
    return [
        `과일 종류: ${fruitType}`,
        `고유 특성: ${c.features.join(", ")}`,
        `주요 셀링 포인트: ${c.sellingPoints.join(", ")}`,
        `경쟁/유사 상품: ${c.competitors.join(", ")}`,
        `일반 시장 가격대: ${c.typicalPriceRange}`,
    ].join("\n");
}
function formatMarketResearch(mr?: MarketResearchInput | null): string {
    if (!mr) return "(실시간 시장 조사 자료 없음 - 일반 시장 지식 기반 분석)";
    const lines: string[] = [];
    if (mr.summary && mr.summary.trim()) {
        lines.push(`[시장 종합 요약]\n${mr.summary.trim()}`);
    }
    const results = (mr.results || []).slice(0, 5);
    if (results.length > 0) {
        lines.push("[관련 시장 정보 - 가격대·경쟁상품·트렌드 분석의 근거로 사용]");
        results.forEach((r, i) => {
            const title = (r.title || "").trim();
            const snippet = (r.snippet || "").trim().slice(0, 220);
            if (title || snippet) {
                lines.push(`${i + 1}. ${title}${snippet ? ` - ${snippet}` : ""}`);
            }
        });
    }
        return lines.length > 0 ? lines.join("\n") : "(실시간 시장 조사 자료 없음)";
}
function formatCompetitors(competitors?: CompetitorInput[]): string {
    if (!competitors || competitors.length === 0) {
        return "(경쟁사 정보 없음 - 일반 시장 지식 기반 분석)";
    }
    const lines = competitors
        .filter((c) => c && (c.name || "").trim())
        .map((c, i) => {
            const parts = [`${i + 1}. ${c.name}`];
            if (c.priceRange && c.priceRange.trim()) {
                parts.push(`가격대: ${c.priceRange}`);
            }
            if (c.strengths && c.strengths.trim()) {
                parts.push(`강점: ${c.strengths}`);
            }
            return parts.join(" / ");
        });
    return lines.length > 0
        ? lines.join("\n")
        : "(경쟁사 정보 없음 - 일반 시장 지식 기반 분석)";
}
function formatWeather(weather?: WeatherInput | null): string {
    if (!weather) return "(실시간 날씨 데이터 없음)";
    const parts: string[] = [];
    if (weather.baseDate && weather.baseTime) {
        const md = `${weather.baseDate.slice(4, 6)}.${weather.baseDate.slice(6, 8)}`;
        const hh = weather.baseTime.slice(0, 2);
        parts.push(`실황 시각: ${md} ${hh}시 (서울 종로구)`);
    }
    if (weather.temperature != null) parts.push(`기온: ${weather.temperature}°C`);
    if (weather.rainfall != null) parts.push(`강수량: ${weather.rainfall}mm`);
    if (weather.humidity != null) parts.push(`습도: ${weather.humidity}%`);
    return parts.length > 0 ? parts.join(" / ") : "(실시간 날씨 데이터 없음)";
}
function formatKamisPrices(kamis?: KamisPricesInput | null): string {
    if (!kamis || !kamis.items || kamis.items.length === 0) {
        return "(KAMIS 시세 데이터 없음)";
    }
    const lines: string[] = [];
    if (kamis.mapping) {
        const m = kamis.mapping;
        const id = [m.categoryName, m.itemName, m.kindName]
            .filter(Boolean)
            .join(" / ");
        if (id) lines.push(`품목: ${id}`);
    }
    if (kamis.period?.startday && kamis.period?.endday) {
        lines.push(`기간: ${kamis.period.startday} ~ ${kamis.period.endday}`);
    }
    const items = (kamis.items || []).slice(0, 8);
    if (items.length > 0) {
        lines.push("[최근 도·소매 시세]");
        items.forEach((it) => {
            const date = it.regday || it.date || "";
            const item = it.itemname || it.item_name || "";
            const kind = it.kindname || it.kind_name || "";
            const county = it.countyname || it.county_name || "";
            const price = it.price || it.dpr1 || "";
            const numPrice = Number(String(price).replace(/[^0-9.-]/g, ""));
            const priceStr = numPrice
                ? `${numPrice.toLocaleString()}원`
                : (price || "-");
            const parts = [date, item, kind, county, priceStr].filter(Boolean);
            lines.push(`- ${parts.join(" · ")}`);
        });
    }
    return lines.length > 0 ? lines.join("\n") : "(KAMIS 시세 데이터 없음)";
}
const PROMPT_TEMPLATES: Record<string, string> = {
    single: `당신은 과일 이커머스 마케팅 전문가입니다. 다음 단품 과일 정보를 기반으로 마케팅 인사이트를 도출해 주세요.
[기본 정보]
상품명: {productName}
당도: {sweetness}
산지: {origin}
제철 시기: {season}
보관법: {storage}
등급: {grade}
상품 설명: {productInfo}
[과일 고유 특성 — 반드시 분석에 반영]
{fruitContext}
[실시간 시장 조사 결과 — 가격 포지셔닝과 차별점 분석에 반드시 반영]
{marketResearch}
위 정보를 종합해, 특히 '과일 고유 특성'과 '실시간 시장 조사 결과'를 적극적으로 반영하여 아래 항목을 한국어 JSON으로 작성해 주세요. 모든 필드를 빠짐없이 채워주세요.
- targetCustomer: 타깃 고객 페르소나 (1~2문장, 과일 고유 특성을 가치 있게 여기는 페르소나로 구체화)
- marketingCopy: 마케팅 카피 (3~4문장, 과일 고유 특성 중 최소 2가지를 자연스럽게 언급)
- seoKeywords: SEO 키워드 10개 배열 (과일 고유 특성·셀링포인트 관련 키워드 4개 이상 포함)
- seasonalCampaign: 제철/계절 캠페인 제안 (1~2문장)
- hashtags: 해시태그 5개 배열 (# 포함, 과일 고유 특성 해시태그 포함)
- pricePositioning: 가격 포지셔닝 제안 (2~3문장, 시장 조사 결과의 가격대와 과일 고유 가격대를 근거로 프리미엄/스탠다드/가성비 중 적합한 포지션과 권장 판매가 범위, 그 이유를 명시)
- differentiation: 경쟁상품 대비 차별점 (2~3문장, 위에 제시된 경쟁/유사 상품과 비교하여 이 상품만의 강점 2~3가지를 자연스러운 문장으로 서술)
- recommendedChannels: 추천 판매 채널 배열. 반드시 "스마트스토어", "쿠팡", "인스타그램 쇼핑" 3개 채널 모두에 대해 [{"channel":"스마트스토어","priority":"high|medium|low","reasoning":"1~2문장으로 단품 과일·산지직송·과일 고유 특성에 비추어 적합/부적합 이유"}, ...] 형태로 작성. 단품 과일은 산지직송 신선도·SEO 검색 트래픽·인증 정보 노출이 강한 채널을 우선순위로 평가`,
    giftset: `당신은 프리미엄 선물세트 전문 마케팅 컨설턴트입니다. 다음 선물세트 정보를 분석하여 명절·기념일·VIP 선물 시장에 적합한 마케팅 전략을 제안해 주세요.
[기본 정보]
상품명: {productName}
구성: {productInfo}
[실시간 시장 조사 결과 — 가격 포지셔닝과 차별점 분석에 반드시 반영]
{marketResearch}
아래 항목을 한국어 JSON으로 작성해 주세요. 모든 필드를 빠짐없이 채워주세요.
- targetCustomer
- marketingCopy
- seoKeywords (10개)
- seasonalCampaign
- hashtags (5개)
- pricePositioning: 가격 포지셔닝 제안 (2~3문장, 시장 조사 결과의 인기 브랜드 가격대를 근거로 권장 가격 범위와 포지션을 제시)
- differentiation: 경쟁상품 대비 차별점 (2~3문장, 시장의 다른 명절 선물세트와 비교한 이 상품만의 차별 포인트)
- recommendedChannels: 추천 판매 채널 배열. 반드시 "스마트스토어", "쿠팡", "인스타그램 쇼핑" 3개 채널 모두에 대해 [{"channel":"스마트스토어","priority":"high|medium|low","reasoning":"1~2문장으로 명절·기념일·VIP 선물 시장 특성에 비추어 적합/부적합 이유"}, ...] 형태로 작성. 선물세트는 명절 시즌 트래픽·카카오톡 선물하기 연동·법인 단체 주문 처리가 강한 채널을 우선순위로 평가`,
    subscription: `당신은 과일 구독 서비스 그로스 마케터입니다. 다음 구독 상품 정보를 기반으로 신규 가입·리텐션 전략을 제안해 주세요.
[기본 정보]
상품명: {productName}
구독 정보: {productInfo}
[실시간 시장 조사 결과 — 가격 포지셔닝과 차별점 분석에 반드시 반영]
{marketResearch}
아래 항목을 한국어 JSON으로 작성해 주세요. 모든 필드를 빠짐없이 채워주세요.
- targetCustomer
- marketingCopy (가입 유도와 리텐션 모두 포함)
- seoKeywords (10개)
- seasonalCampaign
- hashtags (5개)
- pricePositioning: 가격 포지셔닝 제안 (2~3문장, 시장 조사 결과의 경쟁사 구독료를 근거로 권장 월 구독료 범위와 포지션을 제시)
- differentiation: 경쟁상품 대비 차별점 (2~3문장, 다른 과일 구독 서비스 대비 이 상품의 차별 포인트)
- recommendedChannels: 추천 판매 채널 배열. 반드시 "스마트스토어", "쿠팡", "인스타그램 쇼핑" 3개 채널 모두에 대해 [{"channel":"스마트스토어","priority":"high|medium|low","reasoning":"1~2문장으로 구독 서비스 특성에 비추어 적합/부적합 이유"}, ...] 형태로 작성. 구독 서비스는 라이프스타일·언박싱 콘텐츠 노출과 정기결제·약정 운영 안정성이 강한 채널을 우선순위로 평가`,
};
function buildPrompt(body: AnalyzeRequest): string {
    const category = body.category || "single";
    const template = PROMPT_TEMPLATES[category] || PROMPT_TEMPLATES.single;
    const attrs = body.attributes || {};
    let prompt = template
        .replace("{productName}", body.productName || "(미입력)")
        .replace("{productInfo}", body.productInfo || "(미입력)")
        .replace("{sweetness}", attrs.sweetness || "정보 없음")
        .replace("{origin}", attrs.origin || "정보 없음")
        .replace("{season}", attrs.season || "정보 없음")
        .replace("{storage}", attrs.storage || "정보 없음")
        .replace("{grade}", attrs.grade || "정보 없음")
        .replace("{fruitContext}", formatFruitContext(attrs.fruitType))
        .replace("{marketResearch}", formatMarketResearch(body.marketResearch));
    // 추가 컨텍스트: 경쟁사 정보 / 실시간 날씨 / KAMIS 시세
    const additionalSections: string[] = [];
    const competitorsText = formatCompetitors(body.competitors);
    if (!competitorsText.startsWith("(경쟁사 정보 없음")) {
        additionalSections.push(
            `[경쟁사 정보 — 차별점·가격 포지셔닝 분석에 반드시 반영]\n${competitorsText}`,
        );
    }
    const weatherText = formatWeather(body.weather);
    if (!weatherText.startsWith("(실시간 날씨")) {
        additionalSections.push(
            `[실시간 날씨 (기상청 단기실황) — 제철·시즌 캠페인 제안에 반드시 반영]\n${weatherText}`,
        );
    }
    const kamisText = formatKamisPrices(body.kamisPrices);
    if (!kamisText.startsWith("(KAMIS")) {
        additionalSections.push(
            `[KAMIS 농산물 도·소매 시세 — 가격 포지셔닝 분석에 반드시 반영]\n${kamisText}`,
        );
    }
    if (additionalSections.length > 0) {
        prompt += "\n\n" + additionalSections.join("\n\n");
    }
    return prompt;
}
function generateMockAnalysis(body: AnalyzeRequest): AnalyzeResponse {
    const category = body.category || "single";
    const productName = body.productName || "프리미엄 과일";
    const attrs = body.attributes || {};
    const origin = attrs.origin || "국내 산지";
    const season = attrs.season || "제철";
    const sweetness = attrs.sweetness || "고당도";
    if (category === "single") {
        const seasonText = season.includes("9월") || season.includes("10월")
            ? "가을"
            : season.includes("12월") || season.includes("1월") ||
                    season.includes("2월")
            ? "겨울"
            : season.includes("5월") || season.includes("6월") ||
                    season.includes("7월")
            ? "여름"
            : season.includes("3월") || season.includes("4월")
            ? "봄"
            : "제철";
        return {
            targetCustomer:
                `${seasonText} 제철 과일을 찾는 30~40대 가족 단위 소비자, 프리미엄 디저트로 ${productName}을 즐기는 도시 거주 직장인 여성`,
            marketingCopy:
                `이른 새벽 ${origin} 과수원에서 갓 따낸 ${productName}, ${sweetness}의 진한 단맛이 한 알에 담겨 있습니다. 알이 굵고 식감이 좋아 가족 모두가 부담 없이 즐길 수 있어요. ${seasonText} 식탁을 더 풍성하게 만들어 줄 ${productName}, 지금이 가장 좋은 시기입니다.`,
            seoKeywords: [
                productName.split(" ")[0],
                `${origin} ${productName.split(" ")[0]}`,
                `${seasonText}제철과일`,
                `프리미엄 ${productName.split(" ")[0]}`,
                `고당도 ${productName.split(" ")[0]}`,
                "산지직송 과일",
                "당일배송 과일",
                `${seasonText} 과일`,
                "선물용 과일",
                `${productName.split(" ")[0]} 추천`,
            ],
            seasonalCampaign:
                `${seasonText} 시즌 메인 캠페인으로 '${productName} 제철 한정' 컨셉의 EDM·인스타그램 릴스 운영. ${origin} 산지 영상 콘텐츠로 신뢰감을 강조하고, 첫 구매 10% 할인 쿠폰으로 전환율 상승 유도.`,
                        hashtags: [
                `#${productName.split(" ")[0]}`,
                `#${origin.replace(/\s/g, "")}직송`,
                `#${seasonText}제철과일`,
                `#프리미엄과일`,
                `#${sweetness.replace(/\s/g, "")}`,
            ],
            pricePositioning:
                `${attrs.fruitType && FRUIT_CHARACTERISTICS[attrs.fruitType]
                    ? `시장의 일반 ${attrs.fruitType} 가격대(${FRUIT_CHARACTERISTICS[attrs.fruitType].typicalPriceRange})를 기준으로, `
                    : ""}${attrs.grade || "특등급"} 산지직송 컨셉으로 일반 시세 대비 10~20% 상회한 프리미엄 포지셔닝을 권장합니다. 상세페이지에 산지·등급·당도 정보를 강조해 가격 차별화 근거를 명확히 하세요.`,
                        differentiation:
                `${attrs.fruitType && FRUIT_CHARACTERISTICS[attrs.fruitType]
                    ? `${FRUIT_CHARACTERISTICS[attrs.fruitType].competitors.slice(0, 2).join(", ")} 등 유사 상품 대비, ${productName}은 ${FRUIT_CHARACTERISTICS[attrs.fruitType].features.slice(0, 2).join("·")} 같은 고유 특성으로 명확히 구분됩니다. `
                    : ""}산지직송 신선도와 ${attrs.grade || "특등급"} 품질 관리, ${origin} 지역 특산물 정체성으로 일반 유통상품과 차별화됩니다.`,
            recommendedChannels: [
                {
                    channel: "스마트스토어",
                    priority: "high",
                    reasoning:
                        `산지직송 신선식품 SEO 트래픽이 강하고 산지·등급·당도 인증 정보를 상세페이지에 풍부하게 노출할 수 있어 ${productName} 같은 단품 과일에 가장 유리한 채널입니다.`,
                },
                {
                    channel: "쿠팡",
                    priority: "medium",
                    reasoning:
                        "로켓프레시로 빠른 배송 강점이 있지만 산지직송 정체성이 희석되기 쉽고 마진율이 낮아, 인지도 확장용 보조 채널로 활용하는 것을 권장합니다.",
                },
                {
                    channel: "인스타그램 쇼핑",
                    priority: "low",
                    reasoning:
                        "비주얼 콘텐츠로 브랜드 인지도를 쌓기엔 좋지만 신선 단품 과일의 직접 전환율은 낮아, 콘텐츠 마케팅 → 자체몰 유입 경로로 활용하는 것이 효율적입니다.",
                },
            ],
        };
    }
    if (category === "giftset") {
        return {
            targetCustomer:
                `명절·기념일 인사 선물을 찾는 40~60대 임원/관리자, 거래처 답례품을 준비하는 중소기업 마케팅 담당자, VIP 고객 관리가 중요한 50대 이상 사업가`,
            marketingCopy:
                `정성을 담은 한 박스, ${productName}로 마음을 전하세요. 엄선한 제철 과일이 격식 있는 패키지에 담겨 받는 사람의 첫 인상을 결정짓습니다. 명절·기념일·법인 답례품, 어떤 자리에든 어울리는 올프레쉬의 시그니처 선물입니다.`,
            seoKeywords: [
                "프리미엄 과일선물",
                "명절 과일선물",
                "임원 선물",
                "거래처 답례품",
                "VIP 선물세트",
                "추석 선물세트",
                "설 선물",
                "고급 과일세트",
                "법인 선물",
                "연말 답례품",
            ],
            seasonalCampaign:
                "추석·설 D-30 시점 임원/거래처 타깃 EDM 캠페인. 카카오톡 비즈니스 채널 한정 쿠폰 발급 + 30셋 이상 단체 주문 시 핸드라이팅 메시지 카드 무료 인쇄 프로모션.",
                        hashtags: [
                "#명절선물",
                "#프리미엄과일선물",
                "#임원선물",
                "#거래처답례품",
                "#법인선물",
            ],
                        pricePositioning:
                "명절 프리미엄 과일 선물세트 시장 가격대(5만 원 ~ 15만 원)를 참고하여, 7만 원 ~ 12만 원대 프리미엄 포지션을 메인으로 권장합니다. VIP·임원 선물 타깃이라면 15만 원대 럭셔리 라인도 함께 운영해 가격 스펙트럼을 확보하세요.",
            differentiation:
                "일반 유통사 선물세트 대비 산지 큐레이션의 명확성과 패키지 디자인의 격을 차별화 포인트로 가져갑니다. 핸드라이팅 메시지 카드 인쇄·법인 단체 주문 할인 같은 개인화·B2B 옵션도 강력한 차별점이 됩니다.",
            recommendedChannels: [
                {
                    channel: "스마트스토어",
                    priority: "high",
                    reasoning:
                        "카카오톡 선물하기·기프티콘 연동이 가능해 명절·기념일 선물 트래픽을 효과적으로 흡수할 수 있고, 법인 단체 주문 견적도 안정적으로 처리됩니다.",
                },
                {
                    channel: "쿠팡",
                    priority: "high",
                    reasoning:
                        "명절 임박 시점의 로켓배송 수요가 폭발적이고 프리미엄 선물세트 카테고리 노출 효과도 큽니다. 명절 D-7~D-1 기간 메인 채널로 활용하세요.",
                },
                {
                    channel: "인스타그램 쇼핑",
                    priority: "medium",
                    reasoning:
                        "프리미엄 패키지 비주얼을 강조해 브랜드 가치를 전달하기 좋습니다. 명절 캠페인 시기에 광고와 함께 운영하면 보조 전환 채널로 효과적입니다.",
                },
            ],
        };
    }
    // subscription
    return {
        targetCustomer:
            `건강한 식단을 챙기는 1~2인 가구 직장인, 매번 과일 고르기가 번거로운 30대 1인 가구, 자녀 간식과 어른 디저트를 동시에 챙겨야 하는 30~40대 맞벌이 부부`,
        marketingCopy:
            `매주(또는 격주), 제철의 가장 좋은 순간을 골라 보내드립니다. 고를 필요 없이 받아보는 신선함, 한 박스에 담긴 일주일치 비타민으로 바쁜 평일에도 식탁이 풍성해집니다. 첫 4주 30% 할인으로 부담 없이 시작해 보세요.`,
        seoKeywords: [
            "과일구독",
            "과일 정기배송",
            "주간 과일배송",
            "제철과일 구독",
            "1인가구 과일",
            "가족 과일구독",
            "건강식단 구독",
            "비타민 구독",
            "오피스 과일",
            "과일 큐레이션",
        ],
        seasonalCampaign:
            "신학기·연초 '한 주 시작 루틴' 컨셉의 신규 가입 유도 캠페인. 첫 4주 30% 할인 + SNS 인플루언서 언박싱 콘텐츠. 3개월 이상 유지 시 무료 추가 박스 제공으로 리텐션 강화.",
                hashtags: [
            "#과일구독",
            "#정기배송",
            "#제철과일",
            "#비타민루틴",
            "#1인가구추천",
        ],
                pricePositioning:
            "시장의 일반적인 과일 구독 월 구독료(3만 원 ~ 8만 원)를 참고하여, 1~2인 가구 타깃은 월 3.5만~5만 원, 가족 단위는 월 6만~8만 원 라인을 권장합니다. 첫 4주 30% 할인으로 가격 진입 장벽을 낮추고, 3개월 약정 시 추가 할인으로 LTV를 끌어올리세요.",
        differentiation:
            "타 구독 서비스 대비 제철 큐레이션의 정확성과 산지 다양성을 강점으로 가져갑니다. 알레르기·기호 기반 개인화 옵션과 구독 일시정지·박스 사이즈 변경 같은 유연성을 추가하면 차별 포인트가 한층 명확해집니다.",
        recommendedChannels: [
            {
                channel: "인스타그램 쇼핑",
                priority: "high",
                reasoning:
                    "1~2인 가구·맞벌이 부부 타깃이 활발하게 활동하는 채널이며, 언박싱·라이프스타일 콘텐츠와 인플루언서 협업으로 구독 진입을 가장 효과적으로 유도할 수 있습니다.",
            },
            {
                channel: "스마트스토어",
                priority: "high",
                reasoning:
                    "정기결제·쿠폰 관리가 안정적이고 약정 할인 운영이 용이해, 인스타그램 유입 후 실제 구독 결제가 일어나는 메인 전환 채널로 활용하세요.",
            },
            {
                channel: "쿠팡",
                priority: "low",
                reasoning:
                    "정기 구독 카테고리의 트래픽이 약하고 가격 비교 중심 사용자가 많아 LTV 확보가 어렵습니다. 단발성 체험 박스 판매용 보조 채널로만 권장합니다.",
            },
        ],
    };
}

const ANALYZE_SCHEMA: Record<string, unknown> = {
    type: "object",
    additionalProperties: false,
    properties: {
        targetCustomer: { type: "string" },
        marketingCopy: { type: "string" },
        seoKeywords: { type: "array", items: { type: "string" } },
        seasonalCampaign: { type: "string" },
        hashtags: { type: "array", items: { type: "string" } },
        pricePositioning: { type: "string" },
        differentiation: { type: "string" },
        recommendedChannels: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                    channel: { type: "string" },
                    priority: { type: "string", enum: ["high", "medium", "low"] },
                    reasoning: { type: "string" },
                },
                required: ["channel", "priority", "reasoning"],
            },
        },
    },
    required: [
        "targetCustomer",
        "marketingCopy",
        "seoKeywords",
        "seasonalCampaign",
        "hashtags",
        "pricePositioning",
        "differentiation",
        "recommendedChannels",
    ],
};

function normalizeAnalyze(parsed: any): AnalyzeResponse | null {
    if (!parsed || typeof parsed !== "object") return null;
    return {
        targetCustomer: parsed.targetCustomer || "",
        marketingCopy: parsed.marketingCopy || "",
        seoKeywords: Array.isArray(parsed.seoKeywords)
            ? parsed.seoKeywords
            : [],
        seasonalCampaign: parsed.seasonalCampaign || "",
        hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
        pricePositioning: parsed.pricePositioning || "",
        differentiation: parsed.differentiation || "",
        recommendedChannels: Array.isArray(parsed.recommendedChannels)
            ? parsed.recommendedChannels.map((c: any) => ({
                channel: String(c?.channel || ""),
                priority: ["high", "medium", "low"].includes(c?.priority)
                    ? (c.priority as "high" | "medium" | "low")
                    : "medium",
                reasoning: String(c?.reasoning || ""),
            }))
            : [],
    };
}

export async function POST(req: NextRequest) {
    const { error } = await requireSession();
    if (error) return error;
    let body: AnalyzeRequest = {};
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    try {
        if (!body.productName) {
            return NextResponse.json(
                { error: "productName is required" },
                { status: 400 },
            );
        }
        const prompt = buildPrompt(body);
        let result: AnalyzeResponse | null = await callClaudeJson<AnalyzeResponse>({
            system:
                "당신은 한국 과일 이커머스 마케팅 전문가입니다. 반드시 유효한 JSON으로만 응답한다.",
            user: prompt,
            schema: ANALYZE_SCHEMA,
            normalize: normalizeAnalyze,
            maxTokens: 8000,
        });
        if (!result) {
            // Fallback to mock analysis (still produces realistic Korean output)
            result = generateMockAnalysis(body);
        }
        return NextResponse.json(result);
    } catch (e) {
        console.error("analyze-product error:", e);
        return NextResponse.json(
            { error: e instanceof Error ? e.message : "Unknown error" },
            { status: 500 },
        );
    }
}
