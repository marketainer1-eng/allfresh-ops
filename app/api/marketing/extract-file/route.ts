import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

// 업로드된 CSV/PDF/텍스트에서 텍스트를 추출한다.
// - CSV/TXT: UTF-8 디코딩 후 그대로 반환
// - PDF: ANTHROPIC_API_KEY가 있으면 Claude document 블록으로 요지 추출, 없으면 안내
const MAX_CHARS = 12000;

export async function POST(req: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "multipart/form-data가 필요합니다." }, {
      status: 400,
    });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "file 필드가 필요합니다." }, { status: 400 });
  }

  const name = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || name.endsWith(".pdf");
  const buf = Buffer.from(await file.arrayBuffer());

  if (!isPdf) {
    // CSV / TXT 등 텍스트 계열
    const text = buf.toString("utf-8").replace(/\s+\n/g, "\n").trim().slice(0, MAX_CHARS);
    return NextResponse.json({ ok: true, fileName: file.name, kind: "text", text });
  }

  // PDF → Claude document 추출
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      fileName: file.name,
      kind: "pdf",
      error: "PDF 자동 추출에는 ANTHROPIC_API_KEY가 필요합니다. 텍스트로 직접 입력하거나 CSV로 올려 주세요.",
    });
  }
  try {
    const client = new Anthropic({ apiKey });
    const model = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
    const res = await client.messages.create({
      model,
      max_tokens: 2000,
      system:
        "너는 업로드된 상품 자료(PDF)를 읽고 마케팅 분석에 필요한 핵심 정보(상품 특징·구성·산지·당도·가격·타깃 등)를 한국어 평문으로 정리하는 도우미다. 표/문서의 원문 텍스트를 최대한 보존해 요약 없이 추출하라.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: buf.toString("base64") },
            },
            { type: "text", text: "이 문서의 내용을 분석 입력으로 쓸 수 있게 텍스트로 추출해 줘." },
          ],
        },
      ],
    } as Anthropic.Messages.MessageCreateParamsNonStreaming);
    const block = res.content.find((b) => b.type === "text");
    const text = block && block.type === "text" ? block.text.slice(0, MAX_CHARS) : "";
    return NextResponse.json({ ok: !!text, fileName: file.name, kind: "pdf", text });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      fileName: file.name,
      kind: "pdf",
      error: `PDF 추출 실패: ${e instanceof Error ? e.message : "unknown"}`,
    });
  }
}
