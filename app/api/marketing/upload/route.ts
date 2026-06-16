import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";

export const runtime = "nodejs";

// Supabase Storage REST 업로드(의존성 없이 fetch만 사용).
// 공개 버킷 marketing-assets에 저장하고 공개 URL을 반환한다.
// 환경변수 미설정 시 503(키 추가 시 즉시 동작).
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const BUCKET = "marketing-assets";

const MAX_BYTES = 15 * 1024 * 1024; // 15MB

function safeName(name: string): string {
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot).toLowerCase().replace(/[^.a-z0-9]/g, "") : "";
  const base = (dot >= 0 ? name.slice(0, dot) : name)
    .replace(/[^a-zA-Z0-9가-힣._-]/g, "_")
    .slice(0, 60);
  return `${base || "file"}${ext}`;
}

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireSession();
  if (error) return error;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "스토리지가 설정되지 않았습니다. Vercel 환경변수 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY를 추가해 주세요.",
      },
      { status: 503 },
    );
  }

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
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "파일은 15MB 이하만 가능합니다." }, {
      status: 400,
    });
  }

  const folder = (form.get("folder") as string)?.replace(/[^a-z0-9/_-]/gi, "") || "uploads";
  const path = `${ctx.workspaceId}/${folder}/${Date.now()}_${safeName(file.name)}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURI(path)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "true",
      },
      body: buf,
    },
  );
  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { ok: false, error: `업로드 실패 (HTTP ${res.status})`, detail: text.slice(0, 300) },
      { status: 502 },
    );
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodeURI(path)}`;
  return NextResponse.json({
    ok: true,
    url: publicUrl,
    path,
    name: file.name,
    size: file.size,
    type: file.type,
  });
}
