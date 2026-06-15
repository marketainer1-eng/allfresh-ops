import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";
import { requireSession } from "@/lib/session";

// 워크스페이스에 템플릿이 없을 때 자동 시드할 기본 3종
// analyze-product 프롬프트 의도를 요약한 스타터 콘텐츠
const SEED_TEMPLATES: Array<{
  category: string;
  name: string;
  description: string;
  content: string;
  variables: string[];
}> = [
  {
    category: "single",
    name: "단품 과일 분석 프롬프트",
    description: "산지직송 신선 과일 단품의 타깃·카피·SEO·채널 전략을 도출합니다.",
    content: `당신은 과일 이커머스 마케팅 전문가입니다.
다음 단품 과일 정보를 분석해 마케팅 인사이트를 도출하세요.
상품명: {productName}
상품 정보: {productInfo}
과일 고유 특성과 산지직송 신선도를 적극 반영해, 타깃 고객·마케팅 카피·SEO 키워드·시즌 캠페인·가격 포지셔닝·차별점·추천 채널을 한국어 JSON으로 작성하세요.`,
    variables: ["productName", "productInfo"],
  },
  {
    category: "giftset",
    name: "선물세트 분석 프롬프트",
    description: "명절·기념일·VIP 선물 시장에 맞춘 프리미엄 선물세트 전략을 제안합니다.",
    content: `당신은 프리미엄 선물세트 전문 마케팅 컨설턴트입니다.
다음 선물세트 정보를 분석하세요.
상품명: {productName}
구성: {productInfo}
명절·기념일·법인 선물 시장 특성을 반영해, 타깃 고객·마케팅 카피·SEO 키워드·시즌 캠페인·가격 포지셔닝·차별점·추천 채널을 한국어 JSON으로 작성하세요.`,
    variables: ["productName", "productInfo"],
  },
  {
    category: "subscription",
    name: "구독 상품 분석 프롬프트",
    description: "과일 정기배송 구독의 신규 가입·리텐션 전략을 제안합니다.",
    content: `당신은 과일 구독 서비스 그로스 마케터입니다.
다음 구독 상품 정보를 분석하세요.
상품명: {productName}
구독 정보: {productInfo}
신규 가입 유도와 리텐션을 함께 고려해, 타깃 고객·마케팅 카피·SEO 키워드·시즌 캠페인·가격 포지셔닝·차별점·추천 채널을 한국어 JSON으로 작성하세요.`,
    variables: ["productName", "productInfo"],
  },
];

// GET /api/marketing/prompt-templates — 0개면 3종 시드 후 category 순으로 반환
export async function GET() {
  const { ctx, error } = await requireSession();
  if (error) return error;

  const count = await prisma.promptTemplate.count({
    where: { workspaceId: ctx.workspaceId },
  });

  if (count === 0) {
    await prisma.promptTemplate.createMany({
      data: SEED_TEMPLATES.map((t) => ({
        workspaceId: ctx.workspaceId,
        category: t.category,
        name: t.name,
        description: t.description,
        content: t.content,
        variables: t.variables,
      })),
      skipDuplicates: true,
    });
  }

  const data = await prisma.promptTemplate.findMany({
    where: { workspaceId: ctx.workspaceId },
    orderBy: { category: "asc" },
  });

  return apiResponse({ data, total: data.length });
}
