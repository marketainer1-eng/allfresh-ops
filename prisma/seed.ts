import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

function d(yyyy: number, mm: number, dd: number) {
  return new Date(`${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`);
}

async function main() {
  console.log("🌱 Seeding AllFresh demo database...");

  // ── Workspace ──────────────────────────────────────────────────────────────
  const workspace = await prisma.workspace.upsert({
    where: { slug: "allfresh" },
    update: {},
    create: {
      name: "올프레쉬",
      slug: "allfresh",
      ownerEmail: "admin@allfresh.co.kr",
      plan: "pro",
    },
  });

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@allfresh.co.kr" },
    update: {},
    create: {
      email: "admin@allfresh.co.kr",
      name: "김운영",
      role: "admin",
      passwordHash: hashPassword("admin1234"),
      workspaceId: workspace.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "sales@allfresh.co.kr" },
    update: {},
    create: {
      email: "sales@allfresh.co.kr",
      name: "이소싱",
      role: "manager",
      passwordHash: hashPassword("sales1234"),
      workspaceId: workspace.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "ops@allfresh.co.kr" },
    update: {},
    create: {
      email: "ops@allfresh.co.kr",
      name: "박마케팅",
      role: "member",
      passwordHash: hashPassword("ops1234"),
      workspaceId: workspace.id,
    },
  });

  // ── Organization (보조 진단 기능용 유지) ───────────────────────────────────
  let org = await prisma.organization.findFirst({
    where: { workspaceId: workspace.id },
  });
  if (!org) {
    org = await prisma.organization.create({
      data: {
        workspaceId: workspace.id,
        name: "올프레쉬 이커머스사업부",
        industry: "ecommerce",
        size: "11-50",
        contactEmail: "ops@allfresh.co.kr",
        description: "신선식품 온라인 판매 사업부",
      },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  FRUIT PORTFOLIO — 3종 집중 (딸기 / 망고 / 샤인머스캣)
  // ══════════════════════════════════════════════════════════════════════════

  // ── 딸기 ──────────────────────────────────────────────────────────────────
  let strawberry = await prisma.fruit.findFirst({
    where: { workspaceId: workspace.id, name: "딸기" },
  });
  if (!strawberry) {
    strawberry = await prisma.fruit.create({
      data: {
        workspaceId: workspace.id,
        name: "딸기",
        variety: "설향",
        category: "베리류",
        emoji: "🍓",
        seasonStartMonth: 12,
        seasonEndMonth: 5,
        peakStartMonth: 1,
        peakEndMonth: 3,
        sourcingLeadDays: 45,
        marketingLeadDays: 21,
        defaultChannels: ["coupang", "marketkurly", "smartstore"],
        priorityLevel: 3,
        isActive: true,
        description: "국내 최대 소비 과일. 설향 품종 중심. 제철 1~3월 피크. 2025→2026 포장 개선 핵심 과제.",
      },
    });
  }

  // ── 망고 ──────────────────────────────────────────────────────────────────
  let mango = await prisma.fruit.findFirst({
    where: { workspaceId: workspace.id, name: "망고" },
  });
  if (!mango) {
    mango = await prisma.fruit.create({
      data: {
        workspaceId: workspace.id,
        name: "망고",
        variety: "애플망고",
        category: "열대과일",
        emoji: "🥭",
        seasonStartMonth: 6,
        seasonEndMonth: 9,
        peakStartMonth: 7,
        peakEndMonth: 8,
        sourcingLeadDays: 90,
        marketingLeadDays: 30,
        defaultChannels: ["coupang", "smartstore", "ssg"],
        priorityLevel: 2,
        isActive: true,
        description: "제주 애플망고 여름 시즌 주력. 소싱 리드타임 90일로 가장 길다. 현재 농장 계약 지연 리스크.",
      },
    });
  }

  // ── 샤인머스캣 ─────────────────────────────────────────────────────────────
  let shine = await prisma.fruit.findFirst({
    where: { workspaceId: workspace.id, name: "샤인머스캣" },
  });
  if (!shine) {
    shine = await prisma.fruit.create({
      data: {
        workspaceId: workspace.id,
        name: "샤인머스캣",
        variety: "샤인머스캣",
        category: "포도류",
        emoji: "🍇",
        seasonStartMonth: 8,
        seasonEndMonth: 11,
        peakStartMonth: 9,
        peakEndMonth: 10,
        sourcingLeadDays: 60,
        marketingLeadDays: 30,
        defaultChannels: ["marketkurly", "ssg", "smartstore"],
        priorityLevel: 3,
        isActive: true,
        description: "추석 시즌 핵심 고마진 품목. 2025 마진율 27%. 2026 선물세트 전략 강화 예정.",
      },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  CAMPAIGNS
  // ══════════════════════════════════════════════════════════════════════════

  // ── 딸기 2025 (완료 시즌 — 작년 성과 기준) ─────────────────────────────────
  let strawberry2025 = await prisma.fruitCampaign.findFirst({
    where: { fruitId: strawberry.id, year: 2025, season: "winter" },
  });
  if (!strawberry2025) {
    strawberry2025 = await prisma.fruitCampaign.create({
      data: {
        fruitId: strawberry.id,
        workspaceId: workspace.id,
        year: 2025,
        season: "winter",
        title: "2025 설향 딸기 겨울 시즌",
        sourcingStartDate: d(2024, 11, 1),
        pricingDueDate: d(2024, 11, 20),
        contentDueDate: d(2024, 12, 1),
        launchDate: d(2024, 12, 15),
        promoPeakStartDate: d(2025, 1, 1),
        promoPeakEndDate: d(2025, 3, 31),
        reviewDate: d(2025, 4, 15),
        ownerId: adminUser.id,
        status: "completed",
        notes: "완료. 쿠팡 전환율 5.2%, 마켓컬리 전환율 6.1%. 단, 포장 관련 CS가 전체 CS의 61% 차지 — 2026 시즌 반드시 개선.",
      },
    });
  }

  // ── 딸기 2026 (현재 진행 중 — active) ──────────────────────────────────────
  let strawberry2026 = await prisma.fruitCampaign.findFirst({
    where: { fruitId: strawberry.id, year: 2026, season: "winter" },
  });
  if (!strawberry2026) {
    strawberry2026 = await prisma.fruitCampaign.create({
      data: {
        fruitId: strawberry.id,
        workspaceId: workspace.id,
        year: 2026,
        season: "winter",
        title: "2026 설향 딸기 겨울 시즌",
        sourcingStartDate: d(2025, 11, 1),
        pricingDueDate: d(2025, 11, 25),
        contentDueDate: d(2025, 12, 10),
        launchDate: d(2025, 12, 20),
        promoPeakStartDate: d(2026, 1, 5),
        promoPeakEndDate: d(2026, 3, 31),
        reviewDate: d(2026, 4, 20),
        ownerId: adminUser.id,
        status: "active",
        notes: "2025 포장 불만 CS 반영하여 박스 리뉴얼 진행 중. 상세페이지 신선도 정보 강화. 마켓컬리 입점 조건 협의 중.",
      },
    });
  }

  // ── 망고 2026 (준비 중 — planned, 소싱 지연 리스크) ───────────────────────
  let mango2026 = await prisma.fruitCampaign.findFirst({
    where: { fruitId: mango.id, year: 2026, season: "summer" },
  });
  if (!mango2026) {
    mango2026 = await prisma.fruitCampaign.create({
      data: {
        fruitId: mango.id,
        workspaceId: workspace.id,
        year: 2026,
        season: "summer",
        title: "2026 제주 애플망고 여름 시즌",
        sourcingStartDate: d(2026, 3, 1),
        pricingDueDate: d(2026, 4, 30),
        contentDueDate: d(2026, 5, 20),
        launchDate: d(2026, 6, 1),
        promoPeakStartDate: d(2026, 7, 1),
        promoPeakEndDate: d(2026, 8, 31),
        reviewDate: d(2026, 9, 20),
        ownerId: adminUser.id,
        status: "planned",
        notes: "⚠️ 제주 JM농장 신규 계약 협의 중단 — 대체 농장 긴급 탐색 필요. 소싱 시작일(3/1) 기준 현재 지연 상태.",
      },
    });
  }

  // ── 샤인머스캣 2025 (완료 — 우수 성과) ────────────────────────────────────
  let shine2025 = await prisma.fruitCampaign.findFirst({
    where: { fruitId: shine.id, year: 2025, season: "autumn" },
  });
  if (!shine2025) {
    shine2025 = await prisma.fruitCampaign.create({
      data: {
        fruitId: shine.id,
        workspaceId: workspace.id,
        year: 2025,
        season: "autumn",
        title: "2025 샤인머스캣 추석 시즌",
        sourcingStartDate: d(2025, 6, 15),
        pricingDueDate: d(2025, 7, 20),
        contentDueDate: d(2025, 8, 5),
        launchDate: d(2025, 8, 20),
        promoPeakStartDate: d(2025, 9, 1),
        promoPeakEndDate: d(2025, 10, 15),
        reviewDate: d(2025, 11, 10),
        ownerId: adminUser.id,
        status: "completed",
        notes: "완료. 마진율 27% 달성. 마켓컬리 선물세트 품절 2회 발생 — 2026 물량 30% 증편 결정.",
      },
    });
  }

  // ── 샤인머스캣 2026 (기획 중 — 선물세트 전략) ─────────────────────────────
  let shine2026 = await prisma.fruitCampaign.findFirst({
    where: { fruitId: shine.id, year: 2026, season: "autumn" },
  });
  if (!shine2026) {
    shine2026 = await prisma.fruitCampaign.create({
      data: {
        fruitId: shine.id,
        workspaceId: workspace.id,
        year: 2026,
        season: "autumn",
        title: "2026 샤인머스캣 추석 선물세트 시즌",
        sourcingStartDate: d(2026, 5, 15),
        pricingDueDate: d(2026, 7, 10),
        contentDueDate: d(2026, 7, 25),
        launchDate: d(2026, 8, 10),
        promoPeakStartDate: d(2026, 9, 5),
        promoPeakEndDate: d(2026, 10, 20),
        reviewDate: d(2026, 11, 15),
        ownerId: adminUser.id,
        status: "planned",
        notes: "2025 선물세트 품절 2회 반영 → 물량 30% 증편. SSG·마켓컬리 선물세트 동시 론칭 목표. 프리미엄 패키지 디자인 발주 예정.",
      },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  PERFORMANCES
  // ══════════════════════════════════════════════════════════════════════════

  const perfDefs = [
    // 딸기 2025 쿠팡
    {
      fruitId: strawberry.id,
      campaignId: strawberry2025.id,
      channel: "coupang",
      salesAmount: 48500000,
      marginAmount: 9700000,
      marginRate: 20.0,
      csCount: 23,
      returnRate: 2.1,
      conversionRate: 5.2,
      reviewSummary: "신선도 우수 평가 82%. 포장 불량 CS 14건(전체 61%) — 박스 압박으로 인한 눌림 현상. 쿠팡 로켓프레시 평점 4.6.",
      nextAction: "2026 시즌: 에어캡 내장 박스로 교체 완료 필요. 로켓프레시 물량 비중 70% → 85% 확대.",
    },
    // 딸기 2025 마켓컬리
    {
      fruitId: strawberry.id,
      campaignId: strawberry2025.id,
      channel: "marketkurly",
      salesAmount: 31200000,
      marginAmount: 5616000,
      marginRate: 18.0,
      csCount: 11,
      returnRate: 1.8,
      conversionRate: 6.1,
      reviewSummary: "컬리 고객 만족도 높음. 리뷰 평점 4.8. 선물세트 수요 댓글 다수 확인. 재구매율 38%.",
      nextAction: "2026 시즌: 선물세트 패키지(2종) 추가. 마켓컬리 MD 협의 통해 기획전 입점 목표.",
    },
    // 딸기 2025 스마트스토어
    {
      fruitId: strawberry.id,
      campaignId: strawberry2025.id,
      channel: "smartstore",
      salesAmount: 18900000,
      marginAmount: 3402000,
      marginRate: 18.0,
      csCount: 9,
      returnRate: 2.4,
      conversionRate: 3.8,
      reviewSummary: "스마트스토어 광고 전환율 낮음. 이미지 로딩 지연 이슈. 신선도 정보 부족 불만 다수.",
      nextAction: "2026: 상세페이지 신선도 인증 배너 추가. 광고 소재 A/B 테스트 진행.",
    },
    // 샤인머스캣 2025 마켓컬리
    {
      fruitId: shine.id,
      campaignId: shine2025.id,
      channel: "marketkurly",
      salesAmount: 55000000,
      marginAmount: 14850000,
      marginRate: 27.0,
      csCount: 8,
      returnRate: 0.9,
      conversionRate: 5.8,
      reviewSummary: "고마진 최우수 실적. 리뷰 4.9점. 추석 선물세트 2회 품절. 재구매율 51%. '명절 최고 선물' 키워드 1위.",
      nextAction: "2026: 선물세트 물량 30% 증편. 조기 소싱(5월) 필수. SSG 동시 론칭으로 채널 다변화.",
    },
    // 샤인머스캣 2025 SSG
    {
      fruitId: shine.id,
      campaignId: shine2025.id,
      channel: "ssg",
      salesAmount: 28000000,
      marginAmount: 7280000,
      marginRate: 26.0,
      csCount: 5,
      returnRate: 1.1,
      conversionRate: 4.9,
      reviewSummary: "SSG 프리미엄 과일 카테고리 2위. 고가 선물세트 수요 확인.",
      nextAction: "2026: SSG 선물세트 단독 기획 검토. 프리미엄 패키지 강화.",
    },
  ];

  for (const def of perfDefs) {
    const exists = await prisma.fruitPerformance.findFirst({
      where: { fruitId: def.fruitId, campaignId: def.campaignId, channel: def.channel },
    });
    if (!exists) {
      await prisma.fruitPerformance.create({ data: { ...def, workspaceId: workspace.id } });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  TASKS
  // ══════════════════════════════════════════════════════════════════════════

  const today = new Date();
  const past = (days: number) => new Date(today.getTime() - days * 86400000);
  const future = (days: number) => new Date(today.getTime() + days * 86400000);

  const taskDefs = [
    // ── 딸기 2026 ──────────────────────────────────────────────────────────
    {
      fruitId: strawberry.id, campaignId: strawberry2026.id,
      type: "sourcing", title: "설향 산지 2차 계약 확정 (경남 진주 농협)",
      dueDate: past(12), status: "done", priority: "high",
      notes: "진주 농협 300박스 2차 계약 완료. 단가 전년 대비 3% 인하 확보.",
    },
    {
      fruitId: strawberry.id, campaignId: strawberry2026.id,
      type: "pricing", title: "쿠팡/컬리/스마트스토어 채널별 판매가 최종 확정",
      dueDate: past(5), status: "done", priority: "high",
      notes: "쿠팡 18,900원 / 마켓컬리 19,800원 / 스마트스토어 17,500원 확정.",
    },
    {
      fruitId: strawberry.id, campaignId: strawberry2026.id,
      type: "content", title: "상세페이지 리뉴얼 — 포장 개선 사진·신선도 인증 배너 반영",
      dueDate: future(3), status: "in_progress", priority: "high",
      notes: "2025 CS 원인(포장 눌림 61%)을 반영한 에어캡 박스 이미지 포함. 신선도 인증서 GIF 추가 중.",
    },
    {
      fruitId: strawberry.id, campaignId: strawberry2026.id,
      type: "sales", title: "마켓컬리 입점 기획전 협의 — MD 미팅 일정 확정",
      dueDate: future(7), status: "pending", priority: "medium",
      notes: "컬리 MD '딸기 특집전' 1월 3주차 제안 수신. 회신 기한 이번 주.",
    },
    {
      fruitId: strawberry.id, campaignId: strawberry2026.id,
      type: "sales", title: "선물세트 패키지(2종) 상품 등록 — 마켓컬리/스마트스토어",
      dueDate: future(14), status: "pending", priority: "medium",
      notes: "2025 컬리 리뷰에서 선물용 수요 확인. 500g/1kg 2종 구성.",
    },
    {
      fruitId: strawberry.id, campaignId: strawberry2026.id,
      type: "review", title: "1월 피크 중간 성과 점검 (매출·CS·리뷰 분석)",
      dueDate: future(21), status: "pending", priority: "medium",
      notes: "피크 시작 2주 후 중간 점검. CS 건수 및 포장 불만 비율 모니터링.",
    },

    // ── 망고 2026 ──────────────────────────────────────────────────────────
    {
      fruitId: mango.id, campaignId: mango2026.id,
      type: "sourcing", title: "⚠️ 제주 JM농장 계약 대체 농장 긴급 탐색",
      dueDate: past(10), status: "pending", priority: "high",
      notes: "JM농장 계약 협의 중단(가격 이견). 대체 농장 미확정. 소싱 시작일(3/1) 이미 경과 — 현재 지연 상태.",
    },
    {
      fruitId: mango.id, campaignId: mango2026.id,
      type: "sourcing", title: "수입 애플망고(태국·필리핀) 단가 비교 및 품질 검토",
      dueDate: future(14), status: "pending", priority: "high",
      notes: "제주산 대안으로 수입산 검토. 단가 비교표 작성 후 의사결정.",
    },
    {
      fruitId: mango.id, campaignId: mango2026.id,
      type: "pricing", title: "제주 vs 수입 망고 채널별 가격 비교표 작성",
      dueDate: future(21), status: "pending", priority: "medium",
      notes: "소싱 결정 이후 진행 가능. 현재 대기 상태.",
    },
    {
      fruitId: mango.id, campaignId: mango2026.id,
      type: "content", title: "망고 상세페이지 초안 작성 (산지 스토리 포함)",
      dueDate: future(45), status: "pending", priority: "medium",
      notes: "소싱 농장 확정 후 산지 촬영 진행 예정.",
    },

    // ── 샤인머스캣 2026 ────────────────────────────────────────────────────
    {
      fruitId: shine.id, campaignId: shine2026.id,
      type: "sourcing", title: "샤인머스캣 산지 조기 계약 — 5월 이전 완료 목표",
      dueDate: future(30), status: "pending", priority: "high",
      notes: "2025 소싱 단가 12% 상승 리스크 재현 방지. 5월 이전 단가 고정 필수.",
    },
    {
      fruitId: shine.id, campaignId: shine2026.id,
      type: "pricing", title: "추석 선물세트 3종 가격 전략 수립 (1kg/2kg/혼합)",
      dueDate: future(75), status: "pending", priority: "high",
      notes: "2025 품절 2회 반영. 프리미엄/일반 2트랙 전략 검토.",
    },
    {
      fruitId: shine.id, campaignId: shine2026.id,
      type: "content", title: "선물세트 프리미엄 패키지 디자인 발주",
      dueDate: future(90), status: "pending", priority: "medium",
      notes: "SSG 프리미엄 과일 카테고리 타깃. 고급 패키지 디자인 에이전시 발주.",
    },
    {
      fruitId: shine.id, campaignId: shine2026.id,
      type: "sales", title: "SSG·마켓컬리 동시 기획전 MD 협의 시작",
      dueDate: future(60), status: "pending", priority: "medium",
      notes: "2025 SSG 단독 → 2026 양채널 동시 론칭으로 확대.",
    },
  ];

  for (const def of taskDefs) {
    const exists = await prisma.fruitTask.findFirst({
      where: { fruitId: def.fruitId, title: def.title },
    });
    if (!exists) {
      await prisma.fruitTask.create({
        data: {
          fruitId: def.fruitId,
          campaignId: def.campaignId,
          workspaceId: workspace.id,
          type: def.type,
          title: def.title,
          assigneeId: adminUser.id,
          dueDate: def.dueDate,
          status: def.status as any,
          priority: def.priority,
          notes: def.notes,
        },
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  INSIGHTS (작년 성과 → 올해 반영)
  // ══════════════════════════════════════════════════════════════════════════

  const insightDefs = [
    {
      fruitId: strawberry.id,
      campaignId: strawberry2025.id,
      sourceYear: 2025,
      summary: [
        "■ 쿠팡 매출 4,850만원 / 마진율 20.0% / 전환율 5.2%",
        "■ 마켓컬리 매출 3,120만원 / 마진율 18.0% / 전환율 6.1%",
        "■ 전체 CS 23건 중 포장 관련 14건 (61%) — 눌림·찌그러짐 불만",
        "■ 마켓컬리에서 선물세트 수요 댓글 42건 확인",
        "■ 재구매율: 마켓컬리 38%, 쿠팡 29%",
      ].join("\n"),
      recommendation: [
        "→ [반드시 반영] 에어캡 내장 박스로 포장 교체 — CS 50% 이상 감소 목표",
        "→ [신규] 마켓컬리 선물세트 2종(500g/1kg) 출시 — 선물 수요 직접 공략",
        "→ [채널 확대] 마켓컬리 MD 기획전 입점 협의 — 1월 3주차 목표",
        "→ [상세페이지] 신선도 인증 정보 강화 — 스마트스토어 전환율 개선",
        "→ [가격] 쿠팡 로켓프레시 비중 70%→85% 확대로 물류비 절감",
      ].join("\n"),
      linkedToNextCampaign: true,
    },
    {
      fruitId: shine.id,
      campaignId: shine2025.id,
      sourceYear: 2025,
      summary: [
        "■ 마켓컬리 매출 5,500만원 / 마진율 27.0% — 전 과일 중 최고 마진",
        "■ SSG 매출 2,800만원 / 마진율 26.0%",
        "■ 추석 선물세트 품절 2회 (9/5, 9/12) — 기회 손실 약 800만원 추정",
        "■ 재구매율 51% — 전 과일 중 1위",
        "■ '명절 최고 선물' 키워드 검색 1위 (마켓컬리 기준)",
      ].join("\n"),
      recommendation: [
        "→ [물량] 2026 물량 30% 증편 — 품절 기회 손실 방지",
        "→ [소싱] 5월 이전 산지 계약 완료 — 단가 상승 리스크 선제 방어",
        "→ [상품] 선물세트 3종 구성 (1kg/2kg/혼합세트) — 고가 수요 흡수",
        "→ [채널] SSG 프리미엄 선물세트 단독 기획 + 마켓컬리 동시 론칭",
        "→ [패키지] 프리미엄 디자인 패키지 교체 — SSG 프리미엄 과일 1위 목표",
      ].join("\n"),
      linkedToNextCampaign: true,
    },
    {
      fruitId: mango.id,
      campaignId: null,
      sourceYear: 2024,
      summary: [
        "■ 2024 여름 시즌: 쿠팡 매출 2,200만원 / 마진율 19.0%",
        "■ 제주산 소싱 단가 변동성 높음 (±15%)",
        "■ 리드타임 90일로 소싱 지연 시 시즌 전체 타격",
        "■ 여름 피크(7~8월) 집중도 높아 재고 소진 용이",
      ].join("\n"),
      recommendation: [
        "→ [긴급] 2026 소싱 농장 미확정 — 대체 농장 즉시 탐색 필요",
        "→ [대안] 수입 애플망고(태국/필리핀) 단가 비교 병행",
        "→ [리스크] 소싱 지연 시 런칭일(6/1) 준수 불가 — 대체 전략 수립",
        "→ [개선] 산지 다변화로 가격 변동성 완충",
      ].join("\n"),
      linkedToNextCampaign: true,
    },
  ];

  for (const def of insightDefs) {
    const exists = await prisma.fruitInsight.findFirst({
      where: { fruitId: def.fruitId, sourceYear: def.sourceYear },
    });
    if (!exists) {
      await prisma.fruitInsight.create({
        data: {
          fruitId: def.fruitId,
          campaignId: def.campaignId,
          workspaceId: workspace.id,
          sourceYear: def.sourceYear,
          summary: def.summary,
          recommendation: def.recommendation,
          linkedToNextCampaign: def.linkedToNextCampaign,
        },
      });
    }
  }

  console.log("\n✅ Seed complete — AllFresh Demo");
  console.log("   과일   : 딸기(설향) · 망고(애플망고) · 샤인머스캣");
  console.log("   캠페인 : 딸기 2025(완료) / 딸기 2026(active) / 망고 2026(planned/지연) / 샤인머스캣 2025(완료) / 샤인머스캣 2026(planned)");
  console.log("   태스크 : " + taskDefs.length + "건 (망고 소싱 10일 지연 포함)");
  console.log("   인사이트: 딸기·샤인머스캣·망고 (전년 성과 → 올해 반영)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
