// lib/marketing/claudeJson.ts
// 마케팅 에이전트 AI 함수 공용 Claude 호출 헬퍼.
// vibeX 원본은 OpenAI(gpt-4o-mini, response_format:json_object)를 썼으나,
// 본 앱은 이미 ANTHROPIC_API_KEY가 설정돼 있어 Claude structured outputs로 이식한다.
// 키가 없거나 호출이 실패하면 null을 반환 → 호출부가 목업 폴백을 사용한다.

import Anthropic from "@anthropic-ai/sdk";

interface CallClaudeJsonOptions<T> {
  /** 시스템 프롬프트(역할/규칙) */
  system: string;
  /** 사용자 프롬프트(데이터/요청) */
  user: string;
  /** 출력 JSON 스키마(structured outputs 보장용) */
  schema: Record<string, unknown>;
  /** LLM 응답(JSON)을 계약 타입으로 안전 변환. 유효하지 않으면 null. */
  normalize: (raw: any) => T | null;
  /** 기본 8000 */
  maxTokens?: number;
}

/**
 * Claude(api.anthropic.com)로 JSON 응답을 받아 정규화한다.
 * ANTHROPIC_API_KEY가 없거나 호출 실패 시 null을 반환한다(호출부에서 목업 폴백).
 * 모델 기본값 claude-opus-4-8 (ANTHROPIC_MODEL 환경변수로 변경 가능).
 */
export async function callClaudeJson<T>(
  opts: CallClaudeJsonOptions<T>,
): Promise<T | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  try {
    const client = new Anthropic({ apiKey });
    const model = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
    const res = await client.messages.create({
      model,
      max_tokens: opts.maxTokens ?? 8000,
      thinking: { type: "adaptive" },
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
      // output_config(effort/format)는 GA지만 SDK 타입이 늦을 수 있어 캐스팅.
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: opts.schema },
      },
    } as Anthropic.Messages.MessageCreateParamsNonStreaming);

    const textBlock = res.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return null;
    // structured outputs면 순수 JSON. 혹시 펜스가 있으면 제거.
    const raw = textBlock.text.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
    return opts.normalize(JSON.parse(raw));
  } catch (e) {
    console.error("callClaudeJson failed:", e);
    return null;
  }
}
