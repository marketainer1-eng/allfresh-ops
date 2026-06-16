import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";

export const runtime = "nodejs";

// API 키는 환경변수에서만 읽는다(시크릿 하드코딩 금지). 미설정 시 호출부에서 처리.
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || "";
interface PerplexityRequest {
    query?: string;
    mode?: "search" | "agent" | "embeddings";
    maxResults?: number;
    maxTokensPerPage?: number;
    preset?: string;
    input?: string | string[];
    model?: string;
}
interface NormalizedResult {
    title: string;
    url: string;
    snippet: string;
}
async function callSearch(req: PerplexityRequest) {
    const res = await fetch("https://api.perplexity.ai/search", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            query: req.query,
            max_results: req.maxResults ?? 5,
            max_tokens_per_page: req.maxTokensPerPage ?? 512,
        }),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Perplexity Search ${res.status}: ${text.slice(0, 200)}`);
    }
    return await res.json();
}
async function callAgent(req: PerplexityRequest) {
    const res = await fetch("https://api.perplexity.ai/v1/responses", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            preset: req.preset || "fast-search",
            input: req.input || req.query || "",
        }),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Perplexity Agent ${res.status}: ${text.slice(0, 200)}`);
    }
    return await res.json();
}
async function callEmbeddings(req: PerplexityRequest) {
    const res = await fetch("https://api.perplexity.ai/v1/embeddings", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            input: req.input,
            model: req.model || "pplx-embed-v1-4b",
        }),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Perplexity Embeddings ${res.status}: ${text.slice(0, 200)}`);
    }
    return await res.json();
}
function normalizeSearch(raw: any) {
    const list = raw?.results || raw?.data || raw?.web_results || [];
    const results: NormalizedResult[] = (Array.isArray(list) ? list : []).map(
        (item: any) => ({
            title: item.title || item.name || item.heading || "",
            url: item.url || item.link || "",
            snippet: item.snippet || item.description || item.content ||
                item.text || "",
        }),
    );
    return {
        results,
        summary: raw?.summary || raw?.answer || "",
        raw,
    };
}
function normalizeAgent(raw: any) {
    // Perplexity v1/responses 구조: output_text / output / text 등 변동
    const text = raw?.output_text || raw?.text ||
        (Array.isArray(raw?.output)
            ? raw.output.map((o: any) => o?.content?.[0]?.text?.value || "").join(
                "\n",
            )
            : "") || JSON.stringify(raw).slice(0, 1000);
    const citations: NormalizedResult[] = (raw?.citations || []).map(
        (c: any) => ({
            title: c.title || c.url || "",
            url: c.url || "",
            snippet: c.snippet || "",
        }),
    );
    return {
        summary: text,
        results: citations,
        raw,
    };
}

export async function POST(req: NextRequest) {
    const { error } = await requireSession();
    if (error) return error;
    if (!PERPLEXITY_API_KEY) {
        return NextResponse.json(
            { error: "PERPLEXITY_API_KEY가 설정되지 않았습니다.", results: [], summary: "" },
            { status: 503 },
        );
    }
    let body: PerplexityRequest = {};
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    try {
        const mode = body.mode || "search";
        let result: unknown;
        if (mode === "agent") {
            const raw = await callAgent(body);
            result = normalizeAgent(raw);
        } else if (mode === "embeddings") {
            result = await callEmbeddings(body);
        } else {
            const raw = await callSearch(body);
            result = normalizeSearch(raw);
        }
        return NextResponse.json(result);
    } catch (e) {
        console.error("perplexity-search error:", e);
        return NextResponse.json(
            { error: e instanceof Error ? e.message : "Unknown error" },
            { status: 500 },
        );
    }
}
