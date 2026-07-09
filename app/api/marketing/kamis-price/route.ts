import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";

export const runtime = "nodejs";
// 한국 KAMIS 서버 호출 지연을 줄이기 위해 서울(icn1) 리전 선호. 느린 응답 대비 시간 확보.
export const preferredRegion = "icn1";
export const maxDuration = 30;

// 인증값은 환경변수에서만 읽는다(시크릿 하드코딩 금지). KAMIS_API_KEY=인증키, KAMIS_CERT_ID=가입 이메일.
const KAMIS_API_KEY = process.env.KAMIS_API_KEY || "";
const KAMIS_CERT_ID = process.env.KAMIS_CERT_ID || "";

// 결과 캐시(웜 인스턴스 한정, best-effort) — KAMIS는 일별 데이터라 30분 재사용.
const CACHE_TTL_MS = 30 * 60 * 1000;
const priceCache = new Map<string, { t: number; data: unknown }>();
interface KamisRequest {
    startday?: string; // YYYY-MM-DD
    endday?: string; // YYYY-MM-DD
    categoryCode?: string; // 부류코드 (예: 400)
    itemCode?: string; // 품목코드 (예: 411)
    kindCode?: string; // 품종코드 (선택)
    productClsCode?: string; // 01=소매, 02=도매 (기본 01)
    rankCode?: string; // 04=상품, 05=중품 (기본 04)
    countryCode?: string; // 지역코드 (기본 1101=서울)
    convertKgYn?: string; // Y/N (기본 N)
}
function pickItems(raw: any): any[] {
    if (Array.isArray(raw?.data?.item)) return raw.data.item;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.item)) return raw.item;
    if (Array.isArray(raw?.items)) return raw.items;
    return [];
}
function pickErrorCode(raw: any): string | null {
    return raw?.data?.error_code ?? raw?.error_code ?? null;
}
function pickErrorMsg(raw: any): string | null {
    return raw?.data?.error_msg ?? raw?.error_msg ?? raw?.data?.message ??
        raw?.message ?? null;
}
function fmt(d: Date): string {
    return d.toISOString().slice(0, 10);
}
async function callKamis(paramObj: Record<string, string>) {
    const params = new URLSearchParams(paramObj);
    const url =
        `https://www.kamis.or.kr/service/price/xml.do?${params.toString()}`;
    // 개별 호출당 타임아웃(8초) — KAMIS가 느릴 때 전체 요청이 멈추지 않도록.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
        const res = await fetch(url, { signal: controller.signal });
        const httpStatus = res.status;
        const text = await res.text();
        let raw: any;
        try {
            raw = JSON.parse(text);
        } catch {
            // KAMIS가 JSON 대신 XML/HTML을 반환한 경우(주로 인증 오류)
            raw = { parseError: true, rawText: text.slice(0, 1000) };
        }
        return { raw, httpStatus, url };
    } catch (e) {
        return {
            raw: {
                fetchError: true,
                message: e instanceof Error ? e.message : String(e),
            },
            httpStatus: 0,
            url,
        };
    } finally {
        clearTimeout(timer);
    }
}

export async function POST(req: NextRequest) {
    const { error } = await requireSession();
    if (error) return error;
    if (!KAMIS_API_KEY || !KAMIS_CERT_ID) {
        return NextResponse.json(
            { ok: false, error: "KAMIS_API_KEY / KAMIS_CERT_ID가 설정되지 않았습니다.", items: [] },
            { status: 503 },
        );
    }
    let body: KamisRequest = {};
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    try {
        if (!body.categoryCode || !body.itemCode) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "categoryCode와 itemCode는 필수입니다",
                },
                { status: 400 },
            );
        }
        // 캐시 히트(웜 인스턴스) 시 즉시 반환
        const cacheKey = [
            body.categoryCode,
            body.itemCode,
            body.kindCode || "",
            body.rankCode || "",
            body.productClsCode || "",
            body.countryCode || "",
        ].join("|");
        const cached = priceCache.get(cacheKey);
        if (cached && Date.now() - cached.t < CACHE_TTL_MS) {
            return NextResponse.json(cached.data);
        }
        const today = new Date();
        const userEndday = body.endday || fmt(today);
        const userStartday = body.startday ||
            fmt(new Date(today.getTime() - 7 * 86400000));
        // KAMIS는 주말·휴장일·드물게 거래된 품목에 대해 지정한 기간 내 데이터가 없을 수 있음
        // 1차: 사용자 지정 기간 → 2차: 30일 → 3차: 90일 순으로 확장 재시도
        const periods: Array<
            { startday: string; endday: string; label: string }
        > = [
            { startday: userStartday, endday: userEndday, label: "user" },
        ];
        const start30 = fmt(new Date(today.getTime() - 30 * 86400000));
        const start90 = fmt(new Date(today.getTime() - 90 * 86400000));
        if (start30 < userStartday) {
            periods.push({
                startday: start30,
                endday: userEndday,
                label: "30d",
            });
        }
        if (start90 < (periods[periods.length - 1]?.startday || userStartday)) {
            periods.push({
                startday: start90,
                endday: userEndday,
                label: "90d",
            });
        }
        let chosen: any = null;
        let last: any = null;
        const attempts: any[] = [];
        for (const p of periods) {
            const paramObj: Record<string, string> = {
                action: "periodProductList",
                p_productclscode: body.productClsCode || "01",
                p_startday: p.startday,
                p_endday: p.endday,
                p_itemcategorycode: body.categoryCode,
                p_itemcode: body.itemCode,
                p_kindcode: body.kindCode || "",
                p_productrankcode: body.rankCode || "04",
                p_countrycode: body.countryCode || "1101",
                p_convert_kg_yn: body.convertKgYn || "N",
                p_cert_key: KAMIS_API_KEY,
                p_cert_id: KAMIS_CERT_ID,
                p_returntype: "json",
            };
            const result = await callKamis(paramObj);
            const errorCode = pickErrorCode(result.raw);
            const errorMsg = pickErrorMsg(result.raw);
            const items = pickItems(result.raw);
            attempts.push({
                label: p.label,
                period: p,
                httpStatus: result.httpStatus,
                errorCode,
                errorMsg,
                itemCount: items.length,
                fetchError: !!result.raw?.fetchError,
                parseError: !!result.raw?.parseError,
            });
            last = { ...result, errorCode, errorMsg, items, period: p };
            const networkOk = !result.raw?.fetchError && !result.raw?.parseError;
            const authOk = errorCode === null || errorCode === "000";
            // 네트워크·인증 자체가 실패하면 재시도해도 결과 동일 → 즉시 중단
            if (!networkOk || !authOk) {
                break;
            }
            if (items.length > 0) {
                chosen = last;
                break;
            }
        }
        const final = chosen || last;
        const ok = !!chosen;
        // 사용자 친화 에러 메시지
        let userError: string | null = null;
        if (!ok) {
            if (final?.raw?.fetchError) {
                userError = `KAMIS 서버 연결에 실패했습니다 (${final.raw.message})`;
            } else if (final?.raw?.parseError) {
                userError =
                    `KAMIS 응답을 해석할 수 없습니다 (HTTP ${final.httpStatus}). 인증키 또는 가입 이메일이 올바른지 확인해 주세요.`;
            } else if (final?.errorCode && final.errorCode !== "000") {
                userError = `KAMIS 오류 [${final.errorCode}] ${
                    final.errorMsg || ""
                }`.trim();
            } else if ((final?.items?.length || 0) === 0) {
                userError = "최근 90일 동안 해당 품목·기간의 시세 데이터가 없습니다";
            }
        }
        const payload = {
            ok,
            errorCode: final?.errorCode ?? null,
            errorMsg: userError,
            httpStatus: final?.httpStatus ?? 0,
            period: final?.period ?? { startday: userStartday, endday: userEndday },
            items: final?.items || [],
            attempts,
            raw: final?.raw ?? null,
        };
        // 성공(시세 있음) 응답만 캐시
        if (ok) priceCache.set(cacheKey, { t: Date.now(), data: payload });
        return NextResponse.json(payload);
    } catch (e) {
        console.error("kamis-price error:", e);
        return NextResponse.json(
            { error: e instanceof Error ? e.message : "Unknown error" },
            { status: 500 },
        );
    }
}
