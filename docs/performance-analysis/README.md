# 성과분석(멀티채널) — 방법론 문서

올프레쉬 멀티채널 성과분석 기능의 **설계·방법론 원본**이다. 코드는 이미 이식되어 동작하며(아래 매핑 참조), 이 문서들은 그 코드가 "왜 그렇게 계산/해석하는지"의 근거이자 향후 품질 업그레이드의 레퍼런스다.

출처: `allfresh-agent-handoff` 인수인계 패키지(claude.ai 세션에서 설계·검증).

## 핵심 원칙

**계산은 코드(compute), 해석만 LLM.** 업로드 CSV/xlsx는 브라우저에서 코드로 지표(metrics)를 계산하고, LLM에는 "이미 계산된 지표"만 넘겨 해석시킨다. raw 데이터를 LLM에 주지 않는다(수치 날조 방지).

## 문서 ↔ 코드 매핑

| 문서 | 역할 | 대응 코드 |
|---|---|---|
| `SKILL.md` | 통합 분석 방법론(과일선물세트 잣대·크로스채널 규칙). 해석 엔진 시스템 프롬프트의 원본. | `lib/performanceAnalyze.ts`의 `METHODOLOGY` |
| `references/category-lens-fruit-gift.md` | 과일선물세트 카테고리 렌즈(시즌성·선물수요·재구매 양극화) | `lib/performanceAnalyze.ts` (잣대 섹션) |
| `references/cross-channel-integration.md` | 크로스채널 통합 규칙(매출=판매처만, 어트리뷰션=기여만, MER 우선) | `lib/performanceCompute.ts` + `METHODOLOGY` |
| `INTEGRATION.md` | 통합 가이드 + 카페24/스마트스토어/카카오 CSV → metrics 매핑 | `lib/performanceCompute.ts` |
| `런준비_체크리스트.md` | 채널별 원천 데이터 수집 목록(운영 참고) | — |

## 구현 위치(요약)

- 해석 엔진: `lib/performanceAnalyze.ts` (`analyzePerformance()`)
- API(인증): `app/api/analyze-performance/route.ts`
- API(공개 데모): `app/api/demo/analyze-performance/route.ts`
- 계산(compute): `lib/performanceCompute.ts`
- 입력/출력 계약 타입: `lib/performanceTypes.ts`
- 화면: `app/(app)/app/performance/page.tsx` · 공개 데모 `app/demo/performance/page.tsx`

## 남은 업그레이드(문서 §7 기준)

1. compute 매핑 정교화(§3) — 정확도의 90%.
2. 카카오톡스토어 정산 export 스키마 확정.
3. 해석 모델 OpenAI(gpt-4o-mini) → Claude API 전환 시 `SKILL.md`와 동일 엔진으로 해석 품질 상승.
4. 결과를 DB(`Analysis`)에 저장 → History 재열람.
