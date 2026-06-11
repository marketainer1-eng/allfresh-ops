// app/api/demo/analyze-performance/route.ts
// 공개 데모용 성과분석 해석 엔드포인트 — 인증 없이 접근 가능(시연 목적).
// 본체 로직은 lib/performanceAnalyze.ts로 인증 라우트(/api/analyze-performance)와 동일하다.
// DB·세션을 요구하지 않으므로 시드/로그인 없이도 시연할 수 있다.

import { NextRequest } from "next/server";
import { apiError, apiResponse } from "@/lib/utils";
import { analyzePerformance } from "@/lib/performanceAnalyze";
import type { PerfRequest } from "@/lib/performanceTypes";

export async function POST(req: NextRequest) {
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
    console.error("demo analyze-performance error:", e);
    return apiError(e instanceof Error ? e.message : "Unknown error", 500);
  }
}
