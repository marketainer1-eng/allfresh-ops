// lib/performanceTypes.ts
// 올프레쉬 성과분석 — 입력/출력 계약(Contract).
// ★ 설계 원칙: 계산은 코드(compute), 해석만 LLM.
//   업로드 CSV/xlsx는 프런트에서 코드로 metrics(PerfRequest)로 환산해 함수에 넘긴다.
//   raw CSV를 LLM에 통째로 주지 않는다(수치 날조 방지).
// 출처: allfresh-agent-handoff/functions/analyze-performance/index.ts 의 PerfRequest/PerfResponse.

export type Objective = "diagnosis" | "acquisition" | "retention";
export type SeasonFlag = "peak" | "offpeak" | "mixed";
export type ChannelRole = "destination" | "ad"; // destination=판매처(매출), ad=광고/유입(비용·기여)

export interface FunnelStage {
  stage: string; // 예: "방문", "상세조회", "장바구니", "주문서", "결제완료"
  sessions?: number;
  conversionRate?: number; // 다음 단계 전환율(%)
  churnRate?: number; // 이탈률(%)
}

export interface SkuMetric {
  name: string;
  netRevenue?: number;
  orders?: number;
  conversionRate?: number;
  refundRate?: number;
  abandonRate?: number; // 장바구니 포기율(%)
  contributionProfit?: number; // 기여이익(원가·수수료 반영 시)
}

export interface ChannelMetric {
  name: string; // "자사몰" | "스마트스토어" | "카카오톡스토어" ...
  role: ChannelRole;
  netRevenue?: number; // 순매출(취소·환불 차감) — 판매처만
  orders?: number;
  aov?: number; // 객단가
  refundRate?: number; // 환불률(%)
  feeRate?: number; // 채널 수수료율(%)
  cogsRate?: number; // 원가율(%)
  contributionProfit?: number; // 기여이익(원) — 있으면 우선 사용
  contributionMargin?: number; // 기여이익률(%)
  adCost?: number; // 광고비(원) — 광고채널/판매처 귀속분
  reportedRoas?: number; // 플랫폼 보고 ROAS(%) — 방향참고용만
  newBuyerRatio?: number; // 신규 구매자 비중(%)
  repurchaseRate?: number; // 재구매율(%)
  funnel?: FunnelStage[];
  topSkus?: SkuMetric[];
  note?: string;
}

export interface AttributionRow {
  channel: string;
  contributionRevenue?: number; // 어트리뷰션 기여매출(추정) — 매출로 합산 금지
  model?: string; // "마지막클릭" | "데이터기반" 등
}

export interface PerfRequest {
  period?: { start?: string; end?: string };
  seasonFlag?: SeasonFlag; // 성수기/비수기 — 비교 해석의 전제
  comparison?: "YoY" | "prev_period" | "none"; // 권장: YoY
  objectives?: Objective[]; // 기본 [diagnosis, acquisition, retention]
  channels?: ChannelMetric[];
  attribution?: AttributionRow[]; // 방향참고용
  blendedRoas?: number; // MER = 총순매출 ÷ 총광고비 (compute 단계에서 산출)
  skuMappingPresent?: boolean; // 통합 SKU 매핑 테이블 존재 여부
  businessNote?: string; // 진행 캠페인·제약 등
}

// ───────────────────────── 출력 계약 ─────────────────────────
export interface Insight {
  title: string;
  objective: Objective; // 어떤 목적에 기여하는 인사이트인지
  observation: string; // 관찰 (수치+비교기준)
  interpretation: string; // 해석 (원인 가설)
  confidence: "확정" | "유력" | "가설";
  action: string; // 실행 (채널에서 가능한 구체 레버)
  verification: string; // 검증 (성패 지표)
  priority: "높음" | "중간" | "낮음";
}

export interface PerfResponse {
  executiveSummary: string[]; // 3줄: 현황 / 가장 큰 문제 / 가장 시급한 액션
  insights: Insight[];
  risks: string[]; // 목적과 별개의 필수 리스크
  dataLimits: string[]; // 표본·시즌·출처 한계
}
