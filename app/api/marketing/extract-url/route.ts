import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";

export const runtime = "nodejs";

// 상세페이지/경쟁사 URL의 본문 텍스트를 서버에서 가져와 태그를 제거해 반환한다.
// 외부 키 불필요. 차단/오류 시 ok:false로 안내한다.
const MAX_CHARS = 8000;

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(req: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  let body: { url?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청" }, { status: 400 });
  }
  const url = (body.url || "").trim();
  if (!/^https?:\/\//i.test(url)) {
    return NextResponse.json({ ok: false, error: "http(s) URL을 입력해 주세요." }, {
      status: 400,
    });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AllFreshBot/1.0; +https://allfresh-ops.vercel.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `페이지를 불러오지 못했습니다 (HTTP ${res.status}).` },
        { status: 200 },
      );
    }
    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? stripHtml(titleMatch[1]).slice(0, 200) : "";
    const text = stripHtml(html).slice(0, MAX_CHARS);
    return NextResponse.json({ ok: true, url, title, text, length: text.length });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: `URL 수집 중 오류: ${e instanceof Error ? e.message : "unknown"}`,
      },
      { status: 200 },
    );
  }
}
