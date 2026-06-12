// lib/performanceAnalyze.ts
// 성과분석 "해석(insight)" 엔진의 순수 로직.
// route(인증 필요)와 demo route(공개)가 동일 로직을 공유하도록 분리한다.
// ★ 설계 원칙: 입력은 "이미 계산된 지표(metrics=PerfRequest)". 여기서는 해석만 한다(수치 날조 금지).

import Anthropic from "@anthropic-ai/sdk";
import type {
  Insight,
  Objective,
  PerfRequest,
  PerfResponse,
} from "@/lib/performanceTypes";

// 출력 계약(PerfResponse)을 JSON 스키마로 명시 → Claude structured outputs로 스키마 보장.
const PERF_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    executiveSummary: { type: "array", items: { type: "string" } },
    insights: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          objective: {
            type: "string",
            enum: ["diagnosis", "acquisition", "retention"],
          },
          observation: { type: "string" },
          interpretation: { type: "string" },
          confidence: { type: "string", enum: ["확정", "유력", "가설"] },
          action: { type: "string" },
          verification: { type: "string" },
          priority: { type: "string", enum: ["높음", "중간", "낮음"] },
        },
        required: [
          "title",
          "objective",
          "observation",
          "interpretation",
          "confidence",
          "action",
          "verification",
          "priority",
        ],
      },
    },
    risks: { type: "array", items: { type: "string" } },
    dataLimits: { type: "array", items: { type: "string" } },
  },
  required: ["executiveSummary", "insights", "risks", "dataLimits"],
} as const;

// PerfResponse 정규화 — LLM 응답을 계약 타입으로 안전 변환(누락 필드 방어).
function normalizePerfResponse(p: Record<string, unknown>): PerfResponse | null {
  const arr = (v: unknown) => (Array.isArray(v) ? v : []);
  if (!Array.isArray(p.insights)) return null;
  return {
    executiveSummary: arr(p.executiveSummary).map(String),
    insights: arr(p.insights).map((i: Record<string, unknown>) => ({
      title: String(i.title ?? ""),
      objective: (i.objective as Objective) ?? "diagnosis",
      observation: String(i.observation ?? ""),
      interpretation: String(i.interpretation ?? ""),
      confidence: (i.confidence as Insight["confidence"]) ?? "가설",
      action: String(i.action ?? ""),
      verification: String(i.verification ?? ""),
      priority: (i.priority as Insight["priority"]) ?? "중간",
    })),
    risks: arr(p.risks).map(String),
    dataLimits: arr(p.dataLimits).map(String),
  };
}

// ───────────────────────── 방법론(시스템 프롬프트) ─────────────────────────
const METHODOLOGY = `너는 올프레쉬(프리미엄 과일선물세트) 멀티채널 이커머스 성과분석가다.
입력으로 "이미 계산된 지표(metrics)"가 주어진다. 너는 계산하지 말고 해석한다.

[절대 규칙]
1. 입력에 없는 수치를 지어내지 않는다. 주어진 metrics 값만 인용한다. 모르면 "데이터로 알 수 없음"으로 둔다.
2. 매출은 판매처(role=destination)에서만 센다. attribution(어트리뷰션 기여매출)은 추정·방향참고이며 매출로 합산하지 않는다.
3. 플랫폼 보고 ROAS(reportedRoas)는 단순 합·실측 단정 금지. 효율 판단은 blendedRoas(MER) 우선.
4. 채널 간 같은 SKU 수치는 함부로 평균내지 않는다 — 수수료·고객층·가격 차이로 해석.

[과일선물세트 잣대]
- 시즌성 극단: 명절(설·추석) 성수기 vs 비수기 매출 10배+ 차이. seasonFlag와 comparison을 반드시 해석에 반영.
  comparison이 "prev_period"이고 seasonFlag가 성수기→비수기 전환을 포함하면 "당연한 시즌 하락"으로 보고, 매출 급락을 문제로 단정하지 않는다. YoY/시즌분리 비교를 권고한다.
- 선물>자가소비: 고가(5만원+) 비중 큼, 게스트 결제 많음 → 회원 기반 리텐션 지표는 과소 보일 수 있음.
- 재구매 양극화(1시간 이내 / 90일 이상): 습관구매가 아니라 명절·이벤트 주도. 일반몰의 30일 재구매 전략 대신 "명절 주기 리타겟팅(D-30 사전알림)"을 우선 레버로.
- 신선식품: 환불률 이상치는 변심보다 품질·파손·배송 신호로 우선 의심(가설).
- 병목이 상세페이지 전환이면 신규 유입 확대보다 상세 설득력(포장·등급·후기·배송안내) 개선을 먼저.

[목적 가중치] objectives 순서대로 인사이트를 정렬·강조한다.
- diagnosis(진단): 퍼널 병목·이탈매출·적자/저마진 SKU·채널 과의존·환불 이상치·이중집계 의심을 상단 + risks에 필수 보고.
- acquisition(신규): 유입채널·전환키워드·세그먼트·첫구매 전환·상세 설득력·명절 선행 유입.
- retention(리텐션): 재구매 주기·재구매율·금액비중·선물→자가소비 전환·게스트 식별 회수·명절 리타겟팅.

[좋은 인사이트] 모든 insight는 관찰→해석→실행→검증 4요소를 갖춘다. 실행은 채널에서 실제 가능한 레버로. 우선순위(임팩트×실행가능성×목적적합도)를 매긴다.

[필수 리스크 보고] 목적과 무관해도 중대 리스크(적자 채널·환불 급증·단일채널 과의존·이중집계 의심)는 risks에 반드시 넣는다. 강조도는 조절해도 은폐 금지.

[채널 비대칭] feeRate/cogsRate/contributionProfit이 있으면 "외형 매출 순위"와 "기여이익 순위"를 분리해 제시한다. 외형 1등이 이익 1등이 아닐 수 있음을 명시.

반드시 아래 JSON 스키마로만 응답한다. 한국어. JSON 외 텍스트 금지.
{
 "executiveSummary": ["현황 한 줄","가장 큰 문제 한 줄","가장 시급한 액션 한 줄"],
 "insights": [{"title":"","objective":"diagnosis|acquisition|retention","observation":"","interpretation":"","confidence":"확정|유력|가설","action":"","verification":"","priority":"높음|중간|낮음"}],
 "risks": ["..."],
 "dataLimits": ["..."]
}`;

function buildUserPrompt(body: PerfRequest): string {
  const objectives = body.objectives?.length
    ? body.objectives
    : ["diagnosis", "acquisition", "retention"];
  return `다음은 이미 계산된 올프레쉬 멀티채널 성과 지표다. 위 규칙대로 통합 인사이트를 생성하라.

[기간] ${body.period?.start ?? "?"} ~ ${body.period?.end ?? "?"}
[시즌 플래그] ${body.seasonFlag ?? "mixed"}
[비교 기준] ${body.comparison ?? "none"}
[분석 목적(가중치 순)] ${objectives.join(", ")}
[블렌디드 ROAS(MER)] ${body.blendedRoas ?? "미산출"}
[통합 SKU 매핑] ${body.skuMappingPresent ? "있음(상품단위 통합 가능)" : "없음(채널단위까지만 통합)"}
[비즈니스 메모] ${body.businessNote ?? "(없음)"}

[채널 지표(JSON)]
${JSON.stringify(body.channels ?? [], null, 2)}

[어트리뷰션(추정·방향참고만, 매출 합산 금지)]
${JSON.stringify(body.attribution ?? [], null, 2)}`;
}

// Claude(api.anthropic.com) 해석 엔진 — 권장 경로.
// 모델 기본값 claude-opus-4-8(ANTHROPIC_MODEL로 변경 가능). adaptive thinking + structured outputs.
async function callClaude(
  body: PerfRequest,
  apiKey: string,
): Promise<PerfResponse | null> {
  try {
    const client = new Anthropic({ apiKey });
    const model = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
    const res = await client.messages.create({
      model,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: METHODOLOGY,
      messages: [{ role: "user", content: buildUserPrompt(body) }],
      // output_config(effort/format)는 GA지만 SDK 타입이 늦을 수 있어 캐스팅.
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: PERF_RESPONSE_SCHEMA },
      },
    } as Anthropic.Messages.MessageCreateParamsNonStreaming);

    const textBlock = res.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return null;
    // structured outputs면 순수 JSON. 혹시 펜스가 있으면 제거.
    const raw = textBlock.text.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
    return normalizePerfResponse(JSON.parse(raw));
  } catch (e) {
    console.error("analyze-performance Claude call failed:", e);
    return null;
  }
}

async function callOpenAI(
  body: PerfRequest,
  apiKey: string,
): Promise<PerfResponse | null> {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: METHODOLOGY },
          { role: "user", content: buildUserPrompt(body) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;
    const p = JSON.parse(content);
    const arr = (v: unknown) => (Array.isArray(v) ? v : []);
    if (!Array.isArray(p.insights)) return null;
    return {
      executiveSummary: arr(p.executiveSummary).map(String),
      insights: arr(p.insights).map((i: Record<string, unknown>) => ({
        title: String(i.title ?? ""),
        objective: (i.objective as Objective) ?? "diagnosis",
        observation: String(i.observation ?? ""),
        interpretation: String(i.interpretation ?? ""),
        confidence: (i.confidence as Insight["confidence"]) ?? "가설",
        action: String(i.action ?? ""),
        verification: String(i.verification ?? ""),
        priority: (i.priority as Insight["priority"]) ?? "중간",
      })),
      risks: arr(p.risks).map(String),
      dataLimits: arr(p.dataLimits).map(String),
    };
  } catch (e) {
    console.error("analyze-performance OpenAI call failed:", e);
    return null;
  }
}

// API 키 없을 때/실패 시: 입력 지표에서 규칙기반으로 최소 진단 생성(수치 날조 없음).
function generateFallback(body: PerfRequest): PerfResponse {
  const dest = (body.channels ?? []).filter((c) => c.role === "destination");
  const totalRev = dest.reduce((s, c) => s + (c.netRevenue ?? 0), 0);
  const risks: string[] = [];
  const insights: Insight[] = [];

  // 채널 과의존 점검
  if (totalRev > 0) {
    const top = [...dest].sort(
      (a, b) => (b.netRevenue ?? 0) - (a.netRevenue ?? 0),
    )[0];
    const share = top
      ? Math.round(((top.netRevenue ?? 0) / totalRev) * 100)
      : 0;
    if (top && share >= 70) {
      risks.push(`단일 채널(${top.name}) 매출 비중 ${share}% — 채널 과의존 리스크.`);
      insights.push({
        title: `${top.name} 과의존`,
        objective: "diagnosis",
        observation: `${top.name}이 통합 순매출의 ${share}%를 차지(${(
          top.netRevenue ?? 0
        ).toLocaleString()}원).`,
        interpretation: "한 채널 정책·수수료·알고리즘 변화에 매출이 통째로 노출됨(유력).",
        confidence: "유력",
        action: "차순위 채널 노출·프로모션 강화로 매출 분산, 채널별 단독 구성 검토.",
        verification: "차순위 채널 매출 비중 추세, 통합 순매출 변동성.",
        priority: "높음",
      });
    }
  }

  // 외형 매출 vs 기여이익 순위 불일치 점검
  const withCP = dest.filter((c) => typeof c.contributionProfit === "number");
  if (withCP.length >= 2) {
    const byRev = [...withCP].sort(
      (a, b) => (b.netRevenue ?? 0) - (a.netRevenue ?? 0),
    );
    const byCP = [...withCP].sort(
      (a, b) => (b.contributionProfit ?? 0) - (a.contributionProfit ?? 0),
    );
    if (byRev[0]?.name !== byCP[0]?.name) {
      insights.push({
        title: "외형 매출 1등 ≠ 이익 1등",
        objective: "diagnosis",
        observation: `매출 1위는 ${byRev[0].name}이나 기여이익 1위는 ${byCP[0].name}.`,
        interpretation: "채널 수수료·원가 구조 차이로 수익성 순위가 역전(유력).",
        confidence: "유력",
        action: "예산·노출을 기여이익 기준으로 재배분, 저마진 채널 가격·구성 점검.",
        verification: "채널별 기여이익률 추세.",
        priority: "높음",
      });
    }
  }

  // 시즌 비교 경고
  if (body.comparison === "prev_period" && body.seasonFlag === "offpeak") {
    risks.push(
      "직전기간(성수기) 대비 비수기 비교 — 시즌 하락이 과대 해석될 수 있음. YoY 권장.",
    );
  }

  const summary = [
    totalRev > 0
      ? `통합 순매출 ${totalRev.toLocaleString()}원, 판매처 ${dest.length}개 기준.`
      : "매출 지표 부족 — 입력 metrics 보강 필요.",
    risks[0] ?? "현 데이터에서 즉시 보고할 중대 리스크 미탐지.",
    insights[0]?.action ?? "지표를 보강하면 더 정밀한 진단 가능.",
  ];

  return {
    executiveSummary: summary,
    insights,
    risks,
    dataLimits: [
      "본 결과는 AI 키 미설정/실패 시의 규칙기반 폴백으로, 인사이트 범위가 제한적임.",
      "입력은 사전 계산된 지표이며, 원천 데이터 정합성은 compute 단계에서 보장돼야 함.",
    ],
  };
}

// 공유 진입점: 해석 엔진 우선순위 = Claude(권장) → OpenAI → 규칙기반 폴백.
// 키가 모두 없거나 호출 실패 시에도 규칙기반으로 안전하게 동작(수치 날조 없음).
export async function analyzePerformance(
  body: PerfRequest,
): Promise<PerfResponse> {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  let result: PerfResponse | null = null;
  if (ANTHROPIC_API_KEY) {
    result = await callClaude(body, ANTHROPIC_API_KEY);
  }
  if (!result && OPENAI_API_KEY) {
    result = await callOpenAI(body, OPENAI_API_KEY);
  }
  if (!result) result = generateFallback(body);
  return result;
}
