/**
 * 올프레쉬 OPS — 병목 점수 엔진
 *
 * 점수 계산 공식:
 *   bottleneckScore = severity(max 25) + frequency(max 20) + evidence(max 15) + businessImpact(max 10) = 70점 만점
 *
 * 가중치:
 *   severity      : 5점 = 25 → 가중치 5.0
 *   frequency     : 5점 = 20 → 가중치 4.0
 *   evidence      : 0~5개 = 15 → 가중치 3.0 (evidenceCount 기준)
 *   businessImpact: 5점 = 10 → 가중치 2.0
 */

export interface ScoredSymptom {
  id: string;
  title: string;
  journeyStep: string;
  severity: number;
  frequency: number;
  evidenceCount: number;
  businessImpact: number;
  tags: string[];
  totalScore: number;
  severityScore: number;
  frequencyScore: number;
  evidenceScore: number;
  businessImpactScore: number;
}

export interface BottleneckResult {
  rank: number;
  journeyStep: string;
  label: string;
  totalScore: number;
  severityScore: number;
  frequencyScore: number;
  evidenceScore: number;
  businessImpactScore: number;
  symptomIds: string[];
  symptomCount: number;
  tags: string[];
  description: string;
}

const WEIGHTS = {
  severity: 5.0,
  frequency: 4.0,
  evidence: 3.0,  // per count, capped at 5
  businessImpact: 2.0,
} as const;

const MAX_SCORE = {
  severity: 25,
  frequency: 20,
  evidence: 15,
  businessImpact: 10,
} as const;

export const TOTAL_MAX_SCORE = 70;

export function calcSymptomScore(symptom: {
  severity: number;
  frequency: number;
  evidenceCount: number;
  businessImpact: number;
}): ScoredSymptom["totalScore"] {
  const severityScore = Math.min(symptom.severity * WEIGHTS.severity, MAX_SCORE.severity);
  const frequencyScore = Math.min(symptom.frequency * WEIGHTS.frequency, MAX_SCORE.frequency);
  const evidenceScore = Math.min(symptom.evidenceCount * WEIGHTS.evidence, MAX_SCORE.evidence);
  const businessImpactScore = Math.min(symptom.businessImpact * WEIGHTS.businessImpact, MAX_SCORE.businessImpact);
  return +(severityScore + frequencyScore + evidenceScore + businessImpactScore).toFixed(2);
}

export function scoreSymptom(symptom: {
  id: string;
  title: string;
  journeyStep: string;
  severity: number;
  frequency: number;
  evidenceCount: number;
  businessImpact: number;
  tags: string[];
}): ScoredSymptom {
  const severityScore = Math.min(symptom.severity * WEIGHTS.severity, MAX_SCORE.severity);
  const frequencyScore = Math.min(symptom.frequency * WEIGHTS.frequency, MAX_SCORE.frequency);
  const evidenceScore = Math.min(symptom.evidenceCount * WEIGHTS.evidence, MAX_SCORE.evidence);
  const businessImpactScore = Math.min(symptom.businessImpact * WEIGHTS.businessImpact, MAX_SCORE.businessImpact);
  const totalScore = +(severityScore + frequencyScore + evidenceScore + businessImpactScore).toFixed(2);

  return {
    ...symptom,
    totalScore,
    severityScore: +severityScore.toFixed(2),
    frequencyScore: +frequencyScore.toFixed(2),
    evidenceScore: +evidenceScore.toFixed(2),
    businessImpactScore: +businessImpactScore.toFixed(2),
  };
}

/**
 * 여정 단계별로 증상을 그룹핑하여 병목 점수를 집계한다.
 * Top-N 병목을 반환한다.
 */
export function analyzeBottlenecks(
  symptoms: Array<{
    id: string;
    title: string;
    journeyStep: string;
    severity: number;
    frequency: number;
    evidenceCount: number;
    businessImpact: number;
    tags: string[];
  }>,
  topN = 3
): BottleneckResult[] {
  if (symptoms.length === 0) return [];

  // 1) 개별 점수 계산
  const scored = symptoms.map(scoreSymptom);

  // 2) 여정 단계별 그룹핑
  const grouped = new Map<string, ScoredSymptom[]>();
  for (const s of scored) {
    const group = grouped.get(s.journeyStep) ?? [];
    group.push(s);
    grouped.set(s.journeyStep, group);
  }

  // 3) 각 그룹의 집계 점수 계산 (가중 평균 + 볼륨 보너스)
  const stepResults: BottleneckResult[] = [];

  for (const [step, stepSymptoms] of grouped.entries()) {
    const count = stepSymptoms.length;

    // 가중 평균 점수 (각 dimension별)
    const avgSeverity = stepSymptoms.reduce((s, x) => s + x.severityScore, 0) / count;
    const avgFrequency = stepSymptoms.reduce((s, x) => s + x.frequencyScore, 0) / count;
    const avgEvidence = stepSymptoms.reduce((s, x) => s + x.evidenceScore, 0) / count;
    const avgBusinessImpact = stepSymptoms.reduce((s, x) => s + x.businessImpactScore, 0) / count;

    // 볼륨 보너스: 증상이 많을수록 최대 5점 보너스 (log2 스케일)
    const volumeBonus = Math.min(Math.log2(count + 1) * 2, 5);

    const rawTotal = avgSeverity + avgFrequency + avgEvidence + avgBusinessImpact + volumeBonus;
    const totalScore = +Math.min(rawTotal, TOTAL_MAX_SCORE).toFixed(2);

    // 대표 태그 (빈도 상위 5개)
    const tagFreq = new Map<string, number>();
    for (const s of stepSymptoms) {
      for (const t of s.tags) {
        tagFreq.set(t, (tagFreq.get(t) ?? 0) + 1);
      }
    }
    const topTags = [...tagFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([t]) => t);

    // 대표 레이블: 점수 최고 증상의 타이틀
    const topSymptom = stepSymptoms.reduce((a, b) => (a.totalScore > b.totalScore ? a : b));

    stepResults.push({
      rank: 0,
      journeyStep: step,
      label: topSymptom.title,
      totalScore,
      severityScore: +avgSeverity.toFixed(2),
      frequencyScore: +avgFrequency.toFixed(2),
      evidenceScore: +avgEvidence.toFixed(2),
      businessImpactScore: +avgBusinessImpact.toFixed(2),
      symptomIds: stepSymptoms.map((s) => s.id),
      symptomCount: count,
      tags: topTags,
      description: `${stepSymptoms.length}개 증상, 평균 점수 ${((avgSeverity + avgFrequency + avgEvidence + avgBusinessImpact) / 4).toFixed(1)}`,
    });
  }

  // 4) 점수 내림차순 정렬 → Top N
  const sorted = stepResults
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, topN)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  return sorted;
}

export function scoreToSeverityLabel(score: number): string {
  const pct = (score / TOTAL_MAX_SCORE) * 100;
  if (pct >= 80) return "매우 심각";
  if (pct >= 60) return "심각";
  if (pct >= 40) return "보통";
  if (pct >= 20) return "낮음";
  return "매우 낮음";
}
