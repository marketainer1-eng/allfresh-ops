import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";

export const runtime = "nodejs";

interface ForecastRequest {
    productName?: string;
    origin?: string;
    grade?: string;
    salePrice?: number;
    wholesalePrice?: number;
    discountRate?: number;
    avgTemperature?: number;
    rainfall?: number;
    isHoliday?: boolean;
    dayOfWeek?: string;
    month?: number;
    season?: string;
    previousDaySales?: number;
    lastWeekSales?: number;
    lastYearSales?: number;
    modelType?: string;
}
interface BreakdownItem {
    factor: string;
    impact: number;
    description: string;
}
interface ForecastResponse {
    predictedDemand: number;
    confidenceR2: number;
    rmse: number;
    mape: number;
    featureImportance: Record<string, number>;
    modelType: string;
    recommendation: string;
    breakdown: BreakdownItem[];
}
function num(v: unknown, fallback = 0): number {
    const n = Number(v);
    return isNaN(n) ? fallback : n;
}
function predictDemand(req: ForecastRequest): ForecastResponse {
    const prevDay = num(req.previousDaySales);
    const lastWeek = num(req.lastWeekSales);
    const lastYear = num(req.lastYearSales);
    // 가중 평균 (지난주 동요일에 더 높은 가중치)
    const weights = [0.3, 0.4, 0.3];
    const sources = [prevDay, lastWeek, lastYear];
    let baseHistorical = 0;
    let weightSum = 0;
    sources.forEach((v, i) => {
        if (v > 0) {
            baseHistorical += v * weights[i];
            weightSum += weights[i];
        }
    });
    let prediction = weightSum > 0 ? baseHistorical / weightSum : 100;
    const breakdown: BreakdownItem[] = [];
    const productLower = (req.productName || "").toLowerCase();
    // 1. 명절·공휴일 효과
    if (req.isHoliday) {
        const ratio = (productLower.includes("사과") || productLower.includes("배"))
            ? 0.8
            : 0.45;
        const impact = prediction * ratio;
        prediction += impact;
        breakdown.push({
            factor: "명절·공휴일 효과",
            impact: Math.round(ratio * 100),
            description: productLower.includes("사과") || productLower.includes("배")
                ? "명절 대표 과일은 평소 대비 80% 수요 급증"
                : "명절 시즌 수요는 평소 대비 약 45% 증가",
        });
    }
    // 2. 가격 탄력성 (할인 효과)
    const discount = num(req.discountRate);
    if (discount > 0) {
        const ratio = (discount / 100) * 1.3;
        const impact = prediction * ratio;
        prediction += impact;
        breakdown.push({
            factor: `할인 ${discount}% 효과`,
            impact: Math.round(ratio * 100),
            description: "과일은 가격 탄력성이 높아 할인율의 약 1.3배 수요 증가",
        });
    }
    // 3. 도매시세 대비 마진 (낮은 마진 = 경쟁력 → 수요 증가)
    const sale = num(req.salePrice);
    const wholesale = num(req.wholesalePrice);
    if (sale > 0 && wholesale > 0) {
        const margin = (sale - wholesale) / sale;
        if (margin < 0.2) {
            prediction *= 1.05;
            breakdown.push({
                factor: "가격 경쟁력",
                impact: 5,
                description: "도매 대비 마진율 20% 미만 → 가격 경쟁력으로 수요 5% 증가",
            });
        } else if (margin > 0.5) {
            prediction *= 0.95;
            breakdown.push({
                factor: "가격 부담",
                impact: -5,
                description: "마진율 50% 초과 → 가격 저항으로 수요 5% 감소",
            });
        }
    }
    // 4. 날씨 (기온) 효과
    const temp = num(req.avgTemperature, 20);
    const summerFruits = ["수박", "참외", "포도", "복숭아", "자두", "체리"];
    const winterFruits = ["귤", "사과", "배", "단감", "한라봉"];
    const isSummerFruit = summerFruits.some(f => productLower.includes(f));
    const isWinterFruit = winterFruits.some(f => productLower.includes(f));
    if (isSummerFruit && temp >= 25) {
        prediction *= 1.28;
        breakdown.push({
            factor: "고온 + 여름 과일",
            impact: 28,
            description: `기온 ${temp}°C 환경에서 수분 과일 수요 28% 증가`,
        });
    } else if (isWinterFruit && temp < 10) {
        prediction *= 1.15;
        breakdown.push({
            factor: "저온 + 겨울 과일",
            impact: 15,
            description: `기온 ${temp}°C 환경에서 동절기 과일 수요 15% 증가`,
        });
    } else if (isSummerFruit && temp < 15) {
        prediction *= 0.85;
        breakdown.push({
            factor: "기온 부적합",
            impact: -15,
            description: "여름 과일에 기온이 낮아 수요 15% 감소",
        });
    }
    // 5. 강수량 효과
    const rain = num(req.rainfall);
    if (rain > 10) {
        prediction *= 0.85;
        breakdown.push({
            factor: "강수 효과 (호우)",
            impact: -15,
            description: "10mm 이상 강수로 매장 방문객 급감, 수요 15% 감소",
        });
    } else if (rain > 1) {
        prediction *= 0.92;
        breakdown.push({
            factor: "강수 효과",
            impact: -8,
            description: "비 오는 날 매장 방문 감소로 수요 8% 감소",
        });
    }
    // 6. 등급 효과
    if (req.grade === "특") {
        prediction *= 1.08;
        breakdown.push({
            factor: "특등급 프리미엄",
            impact: 8,
            description: "특등급은 선물·답례 수요로 8% 추가 증가",
        });
    } else if (req.grade === "중") {
        prediction *= 0.93;
        breakdown.push({
            factor: "중등급 디스카운트",
            impact: -7,
            description: "중등급은 가격 민감 수요로 7% 감소",
        });
    }
    // 7. 원산지 효과
    if (req.origin === "국내산") {
        prediction *= 1.04;
        breakdown.push({
            factor: "국내산 선호",
            impact: 4,
            description: "신선식품 국내산 선호도로 수요 4% 증가",
        });
    }
    // 8. 요일 효과
    const weekend = ["토", "일"];
    if (req.dayOfWeek && weekend.includes(req.dayOfWeek)) {
        prediction *= 1.18;
        breakdown.push({
            factor: "주말 효과",
            impact: 18,
            description: "주말 가족 단위 구매로 수요 18% 증가",
        });
    } else if (req.dayOfWeek === "월") {
        prediction *= 0.92;
        breakdown.push({
            factor: "월요일 저점",
            impact: -8,
            description: "주 시작일 매출 저점 패턴으로 8% 감소",
        });
    }
    prediction = Math.max(0, Math.round(prediction));
    // 모델별 정확도 (시뮬레이션)
    const modelType = req.modelType === "linear_regression"
        ? "linear_regression"
        : "random_forest";
    const featureImportance = modelType === "random_forest"
        ? {
            "판매 이력": 0.32,
            "가격·할인": 0.22,
            "시간(요일·시즌·명절)": 0.20,
            "날씨": 0.14,
            "상품(등급·원산지)": 0.12,
        }
        : {
            "판매 이력": 0.28,
            "가격·할인": 0.25,
            "시간(요일·시즌·명절)": 0.22,
            "날씨": 0.13,
            "상품(등급·원산지)": 0.12,
        };
    const r2 = modelType === "random_forest" ? 0.87 : 0.78;
    const rmse = Math.max(1, Math.round(prediction * 0.12));
    const mape = modelType === "random_forest" ? 8.4 : 12.6;
    // AI 권장 발주
    let recommendation = "";
    const safetyStock = Math.round(prediction * 0.1);
    if (req.isHoliday) {
        recommendation =
            `명절 수요 폭증 예상. 평소 대비 1.5배(${Math.round(prediction * 1.5).toLocaleString()} 단위) 발주 권장. 신선도 관리 위해 D-1 재발주 옵션 확보 필수.`;
    } else if (rain > 10) {
        recommendation =
            `호우 예보로 매장 방문객 급감. 발주량 ${prediction.toLocaleString()} 단위에서 15% 축소 검토. 신선도 손실 위험을 우선 차단.`;
    } else if (discount > 30) {
        recommendation =
            `고할인 행사. 결품 방지 위해 안전재고 ${(safetyStock * 2).toLocaleString()} 단위 추가 확보(총 ${(prediction + safetyStock * 2).toLocaleString()} 단위) 권장.`;
    } else if (isSummerFruit && temp >= 28) {
        recommendation =
            `폭염 + 여름 과일 시너지. 수요 폭증 가능성 高. 발주 ${(prediction + safetyStock).toLocaleString()} 단위 + 일 2회 보충 발주 체계 가동.`;
    } else {
        recommendation =
            `정상 발주 ${prediction.toLocaleString()} 단위 + 안전재고 ${safetyStock.toLocaleString()} 단위(10%) 유지. 신선도 관리 위해 회전 주기 1일 이내 권장.`;
    }
    return {
        predictedDemand: prediction,
        confidenceR2: r2,
        rmse,
        mape,
        featureImportance,
        modelType,
        recommendation,
        breakdown,
    };
}

export async function POST(req: NextRequest) {
    const { error } = await requireSession();
    if (error) return error;
    let body: ForecastRequest = {};
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    try {
        const result = predictDemand(body);
        return NextResponse.json(result);
    } catch (e) {
        console.error("forecast-demand error:", e);
        return NextResponse.json(
            { error: e instanceof Error ? e.message : "Unknown error" },
            { status: 500 },
        );
    }
}
