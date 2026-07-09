import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";

export const runtime = "nodejs";
// 한국 기상청 서버 호출 지연을 줄이기 위해 서울(icn1) 리전 선호. 느린 응답 대비 시간 확보.
export const preferredRegion = "icn1";
export const maxDuration = 30;

// API 키는 환경변수에서만 읽는다(시크릿 하드코딩 금지). 미설정 시 호출부에서 처리.
const KMA_API_KEY = process.env.KMA_API_KEY || "";

// 결과 캐시(웜 인스턴스 한정, best-effort) — 같은 좌표를 10분간 재사용해 쿼터·지연 절감.
const CACHE_TTL_MS = 10 * 60 * 1000;
const weatherCache = new Map<string, { t: number; data: unknown }>();
interface KmaRequest {
    nx?: number; // 기상청 격자 X (서울 종로구 기본값: 60)
    ny?: number; // 기상청 격자 Y (서울 종로구 기본값: 127)
}
function pad(n: number): string {
    return String(n).padStart(2, "0");
}
// KST 기준 N시간 전의 정시(HH00)로 base_date/base_time 산출
function getBaseDateTimeAt(hoursAgo: number): { baseDate: string; baseTime: string } {
    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    kst.setUTCHours(kst.getUTCHours() - hoursAgo);
    const baseDate = `${kst.getUTCFullYear()}${pad(kst.getUTCMonth() + 1)}${
        pad(kst.getUTCDate())
    }`;
    const baseTime = `${pad(kst.getUTCHours())}00`;
    return { baseDate, baseTime };
}
async function callKma(
    baseDate: string,
    baseTime: string,
    nx: number,
    ny: number,
) {
    const params = new URLSearchParams({
        serviceKey: KMA_API_KEY,
        numOfRows: "100",
        pageNo: "1",
        dataType: "JSON",
        base_date: baseDate,
        base_time: baseTime,
        nx: String(nx),
        ny: String(ny),
    });
    const url =
        `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?${params.toString()}`;
    // 개별 호출당 타임아웃(7초) — 한 호출이 멈춰 전체가 지연되는 것을 방지.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    try {
        const res = await fetch(url, { signal: controller.signal });
        const httpStatus = res.status;
        const text = await res.text();
        let raw: any;
        try {
            raw = JSON.parse(text);
        } catch {
            // 인증 실패·서비스 점검 시 XML/HTML 반환
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
    if (!KMA_API_KEY) {
        return NextResponse.json(
            { ok: false, error: "KMA_API_KEY가 설정되지 않았습니다.", items: [] },
            { status: 503 },
        );
    }
    let body: KmaRequest = {};
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    try {
        const nx = typeof body.nx === "number" ? body.nx : 60;
        const ny = typeof body.ny === "number" ? body.ny : 127;
        // 캐시 히트(웜 인스턴스) 시 즉시 반환 — 외부 호출·지연 회피
        const cacheKey = `${nx},${ny}`;
        const cached = weatherCache.get(cacheKey);
        if (cached && Date.now() - cached.t < CACHE_TTL_MS) {
            return NextResponse.json(cached.data);
        }
        // KMA 단기실황은 매시 정각 자료가 약 40분 후 제공되므로,
        // 1~3시간 전 base_time을 순차 시도하여 데이터를 확보
        const attempts: Array<{
            baseDate: string;
            baseTime: string;
            httpStatus: number;
            resultCode: string | null;
            resultMsg: string | null;
            itemCount: number;
        }> = [];
        let chosen:
            | {
                baseDate: string;
                baseTime: string;
                raw: any;
                httpStatus: number;
                resultCode: string | null;
                resultMsg: string | null;
                items: any[];
            }
            | null = null;
        let lastResponse: any = null;
        for (let i = 1; i <= 3; i++) {
            const { baseDate, baseTime } = getBaseDateTimeAt(i);
            const { raw, httpStatus } = await callKma(
                baseDate,
                baseTime,
                nx,
                ny,
            );
            const resultCode = raw?.response?.header?.resultCode ?? null;
            const resultMsg = raw?.response?.header?.resultMsg ?? null;
            const items: any[] = raw?.response?.body?.items?.item || [];
            attempts.push({
                baseDate,
                baseTime,
                httpStatus,
                resultCode,
                resultMsg,
                itemCount: items.length,
            });
            lastResponse = {
                baseDate,
                baseTime,
                raw,
                httpStatus,
                resultCode,
                resultMsg,
                items,
            };
            // 인증·기타 실패는 즉시 중단 (재시도해도 같은 결과)
            const isAuthOrServiceError = resultCode &&
                resultCode !== "00" && resultCode !== "03";
            // resultCode 03 = NO_DATA → 더 이전 시각으로 재시도
            if (resultCode === "00" && items.length > 0) {
                chosen = lastResponse;
                break;
            }
            if (isAuthOrServiceError) {
                break;
            }
        }
        const final = chosen || lastResponse;
        // category → obsrValue 매핑 (T1H=기온, RN1=강수량, REH=습도, PTY=강수형태, WSD=풍속)
        const valueMap: Record<string, string> = {};
        for (const it of (final.items || [])) {
            if (it?.category && it?.obsrValue !== undefined) {
                valueMap[it.category] = it.obsrValue;
            }
        }
        const toNumOrNull = (v: string | undefined): number | null => {
            if (v === undefined || v === null || v === "") return null;
            const n = Number(v);
            return Number.isFinite(n) ? n : null;
        };
        const temperature = toNumOrNull(valueMap.T1H);
        let rainfall: number | null = toNumOrNull(valueMap.RN1);
        if (rainfall === null && valueMap.RN1 !== undefined) {
            rainfall = 0;
        }
        const humidity = toNumOrNull(valueMap.REH);
        const windSpeed = toNumOrNull(valueMap.WSD);
        const precipitationType = valueMap.PTY ?? null;
        const ok = !!chosen;
        // 실패 시 사용자 친화 메시지 구성
        let userMsg: string | null = final?.resultMsg ?? null;
        if (!ok) {
            if (final?.raw?.fetchError) {
                userMsg = `기상청 서버 연결에 실패했습니다 (${final.raw.message})`;
            } else if (final?.raw?.parseError) {
                userMsg =
                    `기상청 응답을 해석할 수 없습니다 (HTTP ${final.httpStatus}). 인증키가 올바른지 확인해 주세요.`;
            } else if (final?.resultCode && final.resultCode !== "00") {
                userMsg = `기상청 오류 [${final.resultCode}] ${
                    final.resultMsg || ""
                }`.trim();
            } else if ((final?.items?.length || 0) === 0) {
                userMsg = "최근 3시간의 기상청 단기실황 데이터가 없습니다";
            }
        }
        const payload = {
            ok,
            resultCode: final?.resultCode ?? null,
            resultMsg: userMsg,
            httpStatus: final?.httpStatus ?? 0,
            baseDate: final?.baseDate ?? null,
            baseTime: final?.baseTime ?? null,
            nx,
            ny,
            temperature,
            rainfall,
            humidity,
            windSpeed,
            precipitationType,
            items: final?.items || [],
            attempts,
            raw: final?.raw ?? null,
        };
        // 성공 응답만 캐시(빈 값/오류는 캐시하지 않음)
        if (ok) weatherCache.set(cacheKey, { t: Date.now(), data: payload });
        return NextResponse.json(payload);
    } catch (e) {
        console.error("kma-weather error:", e);
        return NextResponse.json(
            { error: e instanceof Error ? e.message : "Unknown error" },
            { status: 500 },
        );
    }
}
