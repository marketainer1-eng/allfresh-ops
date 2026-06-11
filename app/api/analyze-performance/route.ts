// app/api/analyze-performance/route.ts
// 올프레쉬 멀티채널 성과분석 — "해석(insight)" 엔진(인증 필요).
// ★ 설계 원칙: 이 라우트는 "이미 계산된 지표(metrics=PerfRequest)"를 받아 해석만 한다.
//   CSV 원문 파싱·기여이익·MER 등 "계산"은 프런트(lib/performanceCompute.ts)에서 끝낸 뒤 넘긴다.
//   해석 로직 본체는 lib/performanceAnalyze.ts에 있다(공개 demo 라우트와 공유).

import { NextRequest } from "next/server";
import { apiError, apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";
import { analyzePerformance } from "@/lib/performanceAnalyze";
import type { PerfRequest } from "@/lib/performanceTypes";

export async function POST(req: NextRequest) {
  const { error: authError } = await requireSession();
  if (authError) return authError;
  try {
    let body: PerfRequest = {};
    try {
      body = (await req.json()) as PerfRequest;
    } catch {
      // empty body — 폴백이 빈 metrics를 안전하게 처리
    }
    const result = await analyzePerformance(body);
    return apiResponse(result);
  } catch (e) {
    console.error("analyze-performance error:", e);
    return apiError(e instanceof Error ? e.message : "Unknown error", 500);
  }
}
