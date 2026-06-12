# 올프레쉬 성과분석 에이전트 — ops 앱 통합 가이드

이 앱(VibeX/React + Deno 엣지함수) 구조에 맞춰, `allfresh-integrated-analysis` 스킬 방법론을 **성과분석 에이전트**로 구현하는 방법.

## 0. 아키텍처 — 2단 분리 (가장 중요)

기존 함수(analyze-strategy 등)는 상품 텍스트를 LLM에 통째로 넘긴다. 성과분석은 **실데이터(여러 CSV)** 를 다루므로 같은 패턴을 쓰면 LLM이 숫자를 지어낸다. 반드시 분리한다.

```
[원천 데이터]  자사몰 CSV · 스마트스토어 export · 카카오 정산
      │
      ▼  (1) 계산 — 코드 (LLM 아님)
[compute 단계]  파싱 → 정규화 → 채널별 순매출·기여이익·MER·퍼널·세그먼트 산출
      │         = "metrics" JSON  (analyze-performance의 입력 계약)
      ▼  (2) 해석 — LLM
[analyze-performance 함수]  metrics + 잣대(과일선물세트·크로스채널·목적가중치) → 인사이트
      │
      ▼
[프런트]  StrategyDashboard 패턴의 결과 화면 + Analysis 엔티티 저장
```

원칙: **계산은 코드, 잣대는 LLM.** `analyze-performance`는 "이미 계산된 지표"만 받아 해석한다. raw CSV를 LLM에 주지 않는다.

## 1. 함수 설치
`functions/analyze-performance/index.ts` 로 넣는다(이미 제공). 앱의 함수 템플릿(Deno.serve, corsHeaders, `OPENAI_API_KEY`, gpt-4o-mini, json_object, mock 폴백)을 그대로 따르므로 추가 설정 없이 동작한다. 프런트에서:

```js
const res = await vibex.functions.invoke('analyze-performance', { body: metrics });
// res.data = { executiveSummary, insights[], risks[], dataLimits[] }
```

## 2. 입력 계약(metrics) — compute 단계가 채운다
함수 상단 `PerfRequest` 타입이 계약이다. 핵심 필드:
- `channels[]`: 각 채널 `{ name, role:'destination'|'ad', netRevenue, aov, refundRate, feeRate, cogsRate, contributionProfit, adCost, newBuyerRatio, repurchaseRate, funnel[], topSkus[] }`
- `attribution[]`: 어트리뷰션 기여매출(추정·방향참고만 — 매출 합산 금지)
- `period`, `seasonFlag('peak'|'offpeak'|'mixed')`, `comparison('YoY' 권장)`, `objectives(['diagnosis','acquisition','retention'])`, `blendedRoas(MER)`, `skuMappingPresent`

**핵심: 매출은 role='destination' 채널에만 넣는다. 광고/유입은 role='ad'로 비용·기여만.** 이걸 지켜야 이중집계가 막힌다.

## 3. compute 단계 — CSV → metrics 매핑 (채널별)
compute는 프런트 유틸 또는 별도 함수로 구현한다. 실제 카페24 export 컬럼 기준 매핑 예시:

**자사몰(카페24)**
| metrics 필드 | 출처 CSV / 계산 |
|---|---|
| netRevenue | `월별_매출내역` 순매출(=결제합계−환불합계) 또는 `구매_분석` order_amount 합 |
| aov | netRevenue ÷ order_count |
| refundRate | 환불합계 ÷ 결제합계 |
| funnel[] | `구매단계_분석`/`구매_전환_퍼널_분석` stage·conversion_rate·churn_rate |
| topSkus[] | `상품별_매출_분석` (order_amount, conversion_rate), 포기율은 `이탈_매출_분석`/`포기한_상품` |
| attribution[] | `채널별_기여_상세` (contribution_revenue) → **attribution에만**, netRevenue 아님 |
| contributionProfit | netRevenue − COGS(원가율) − PG수수료 − 할인·포인트(`월별_매출내역`의 네이버포인트·적립) |

**스마트스토어**: 구매확정내역→순매출·기여이익, 판매성과→AOV·요일/시간, 상품성과→topSkus, 마케팅채널→attribution. (smartstore-analysis 스킬 스키마 사용)

**카카오톡스토어**: 정산·주문 export→netRevenue·feeRate. 스키마 확인 후 매핑.

**기여이익 계산식(공통)**: `순매출 − 원가 − 채널수수료 − 광고비 − 할인·쿠폰·적립/포인트`. 원가·수수료율 보유 중이므로 채널별 산출 가능 → 외형 매출과 이익 순위를 분리 제시.

## 4. 시즌·통합 가드(compute에서 세팅)
- `seasonFlag`: 기간이 명절(1~2월/9~10월) 포함이면 'peak', 비수기면 'offpeak'. 함수가 이걸로 "당연한 시즌 하락"을 문제로 오진하지 않게 한다.
- `comparison`: 가능하면 'YoY'. 직전기간 비교는 시즌 왜곡 주의.
- `blendedRoas(MER)` = 총 순매출(판매처 합) ÷ 총 광고비. compute에서 산출해 넘긴다.
- `skuMappingPresent`: 통합 SKU 매핑 테이블이 있으면 true → 상품단위 통합, 없으면 채널단위까지만.

## 5. 프런트·저장
- 화면: `StrategyDashboard.jsx` 패턴 재사용. Executive Summary 3줄 → 인사이트 카드(관찰→해석→실행→검증, objective 태그/priority) → 리스크 → 데이터 한계.
- 저장: `Analysis` 엔티티에 `{type:'performance', period, metrics, result}` 형태로 저장하면 History에서 재열람 가능.
- 입력 UI: NewAnalysis의 파일 업로드(CSV) 패턴 활용 → 업로드 시 compute 실행 → metrics 미리보기 → 분석 실행.

## 6. 검증 체크리스트 (반드시)
- [ ] 매출이 destination 채널에만 들어갔는가 (attribution을 매출에 더하지 않았는가)
- [ ] 기여이익에 채널 수수료·원가·포인트가 반영됐는가
- [ ] seasonFlag/comparison이 시즌 왜곡을 막게 세팅됐는가
- [ ] blendedRoas로 효율을 보고, 플랫폼 ROAS를 합산하지 않았는가
- [ ] 표본 작은 비수기 구간에 한계 표기가 붙는가

## 7. 다음 단계
1. **compute 유틸 구현** — 위 §3 매핑을 코드로(채널별 파서 + 기여이익·MER 계산). 이게 정확도의 90%.
2. **카카오 채널 스키마 확정** — 정산 export 컬럼 매핑.
3. **성과분석 페이지** — StrategyDashboard 패턴으로 결과 렌더 + Analysis 저장.
4. (선택) 정기 실행 — Schedule/ExecutionTask로 주간·월간 자동 성과분석.

가장 임팩트 큰 건 **§3 compute 유틸**이다. 함수(해석 엔진)는 완성됐으니, 이제 "정확한 숫자를 만들어 넘기는" 계산 레이어가 정확도를 좌우한다.
