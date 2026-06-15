"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Database, Loader2, ArrowLeft, Save, Trash2, RefreshCw, Link as LinkIcon,
  TrendingUp, Power,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

// ── KAMIS 코드 데이터 (KamisMapping.jsx에서 이식) ─────────────────────
const KAMIS_CATEGORIES = [
  { code: "100", name: "식량작물" },
  { code: "200", name: "채소류" },
  { code: "300", name: "특용작물" },
  { code: "400", name: "과일류" },
  { code: "500", name: "축산물" },
  { code: "600", name: "수산물" },
];
const KAMIS_ITEMS: Record<string, { code: string; name: string }[]> = {
  "100": [
    { code: "111", name: "쌀" },
    { code: "112", name: "찹쌀" },
    { code: "113", name: "콩" },
  ],
  "200": [
    { code: "211", name: "배추" },
    { code: "212", name: "양배추" },
    { code: "213", name: "시금치" },
    { code: "214", name: "상추" },
    { code: "225", name: "토마토" },
    { code: "226", name: "방울토마토" },
  ],
  "300": [],
  "400": [
    { code: "411", name: "사과" },
    { code: "412", name: "배" },
    { code: "413", name: "복숭아" },
    { code: "414", name: "포도" },
    { code: "415", name: "감귤" },
    { code: "416", name: "단감" },
    { code: "418", name: "바나나" },
    { code: "419", name: "참다래(키위)" },
    { code: "420", name: "파인애플" },
    { code: "421", name: "오렌지" },
    { code: "422", name: "체리" },
    { code: "423", name: "망고" },
    { code: "424", name: "레몬" },
    { code: "425", name: "자몽" },
    { code: "426", name: "딸기" },
    { code: "427", name: "수박" },
    { code: "428", name: "참외" },
    { code: "429", name: "메론" },
    { code: "430", name: "블루베리" },
    { code: "431", name: "아보카도" },
  ],
  "500": [],
  "600": [],
};
const KAMIS_KINDS: Record<string, { code: string; name: string }[]> = {
  "411": [
    { code: "01", name: "후지" },
    { code: "02", name: "홍로" },
    { code: "05", name: "아오리" },
  ],
  "412": [
    { code: "01", name: "신고" },
    { code: "02", name: "원황" },
  ],
  "413": [{ code: "00", name: "복숭아(일반)" }],
  "414": [
    { code: "01", name: "캠벨얼리" },
    { code: "02", name: "거봉" },
    { code: "06", name: "샤인머스캣" },
  ],
  "415": [{ code: "00", name: "감귤(일반)" }],
  "416": [{ code: "00", name: "단감(일반)" }],
  "423": [
    { code: "00", name: "망고(일반)" },
    { code: "01", name: "애플망고" },
  ],
  "426": [{ code: "00", name: "딸기(일반)" }],
  "427": [{ code: "00", name: "수박(일반)" }],
  "428": [{ code: "00", name: "참외(일반)" }],
  "429": [{ code: "00", name: "메론(일반)" }],
  "430": [{ code: "00", name: "블루베리(일반)" }],
  "431": [{ code: "00", name: "아보카도(일반)" }],
  "225": [
    { code: "00", name: "일반토마토" },
    { code: "02", name: "대추방울토마토" },
  ],
  "226": [{ code: "00", name: "방울토마토(일반)" }],
};
const RANK_CODES = [
  { code: "04", name: "상품" },
  { code: "05", name: "중품" },
];

interface Mapping {
  id: string;
  productName: string;
  categoryCode: string;
  categoryName: string | null;
  itemCode: string;
  itemName: string | null;
  kindCode: string | null;
  kindName: string | null;
  rankCode: string | null;
  isActive: boolean;
  createdAt: string;
}

interface PriceResult {
  ok: boolean;
  errorCode?: string | null;
  errorMsg?: string | null;
  period?: { startday?: string; endday?: string };
  items?: Record<string, string>[];
}

function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function KamisPage() {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [priceResult, setPriceResult] = useState<PriceResult | null>(null);

  const [editId, setEditId] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [categoryCode, setCategoryCode] = useState("400");
  const [itemCode, setItemCode] = useState("");
  const [kindCode, setKindCode] = useState("");
  const [rankCode, setRankCode] = useState("04");

  function flash(type: "ok" | "err", msg: string) {
    setNotice({ type, msg });
    setTimeout(() => setNotice(null), 3500);
  }

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/marketing/kamis-mappings");
      const json = await res.json();
      setMappings(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const itemOptions = KAMIS_ITEMS[categoryCode] ?? [];
  const kindOptions = KAMIS_KINDS[itemCode] ?? [];

  function resetForm() {
    setEditId(null);
    setProductName("");
    setCategoryCode("400");
    setItemCode("");
    setKindCode("");
    setRankCode("04");
    setPriceResult(null);
  }

  function startEdit(m: Mapping) {
    setEditId(m.id);
    setProductName(m.productName);
    setCategoryCode(m.categoryCode || "400");
    setItemCode(m.itemCode || "");
    setKindCode(m.kindCode || "");
    setRankCode(m.rankCode || "04");
    setPriceResult(null);
  }

  function buildPayload() {
    const category = KAMIS_CATEGORIES.find((c) => c.code === categoryCode);
    const item = (KAMIS_ITEMS[categoryCode] ?? []).find((i) => i.code === itemCode);
    const kind = (KAMIS_KINDS[itemCode] ?? []).find((k) => k.code === kindCode);
    return {
      productName: productName.trim(),
      categoryCode,
      categoryName: category?.name ?? "",
      itemCode,
      itemName: item?.name ?? "",
      kindCode: kindCode || undefined,
      kindName: kind?.name ?? "",
      rankCode: rankCode || "04",
    };
  }

  async function save() {
    if (!productName.trim()) return flash("err", "상품명을 입력하세요.");
    if (!categoryCode || !itemCode) return flash("err", "부류와 품목 코드는 필수입니다.");
    setSaving(true);
    try {
      const payload = buildPayload();
      const res = editId
        ? await fetch(`/api/marketing/kamis-mappings/${editId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/marketing/kamis-mappings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, isActive: true }),
          });
      if (!res.ok) throw new Error();
      flash("ok", "매핑이 저장되었습니다.");
      resetForm();
      await load();
    } catch {
      flash("err", "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(m: Mapping) {
    const res = await fetch(`/api/marketing/kamis-mappings/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !m.isActive }),
    });
    if (res.ok) {
      setMappings((prev) =>
        prev.map((x) => (x.id === m.id ? { ...x, isActive: !x.isActive } : x)),
      );
    }
  }

  async function remove(id: string) {
    if (!confirm("이 매핑을 삭제할까요?")) return;
    const res = await fetch(`/api/marketing/kamis-mappings/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMappings((prev) => prev.filter((x) => x.id !== id));
      if (editId === id) resetForm();
    }
  }

  async function testPrice() {
    if (!categoryCode || !itemCode) return flash("err", "먼저 부류·품목을 선택해 주세요.");
    setTesting(true);
    setPriceResult(null);
    try {
      const today = new Date();
      const res = await fetch("/api/marketing/kamis-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startday: fmt(new Date(today.getTime() - 30 * 86400000)),
          endday: fmt(today),
          categoryCode,
          itemCode,
          kindCode: kindCode || undefined,
          productClsCode: "01",
          rankCode: rankCode || "04",
          countryCode: "1101",
          convertKgYn: "N",
        }),
      });
      if (res.status === 503) {
        flash("err", "KAMIS 키 미설정 — 환경변수를 확인해 주세요.");
        return;
      }
      const data = (await res.json()) as PriceResult;
      setPriceResult(data);
      if (data.ok) {
        flash("ok", `KAMIS 응답 수신 (${data.items?.length ?? 0}건)`);
      } else {
        flash("err", `KAMIS 오류 — ${data.errorMsg || data.errorCode || "unknown"}`);
      }
    } catch {
      flash("err", "KAMIS 조회 중 오류가 발생했습니다.");
    } finally {
      setTesting(false);
    }
  }

  const inputCls =
    "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:bg-gray-50 disabled:text-gray-400";

  const activeCount = useMemo(() => mappings.filter((m) => m.isActive).length, [mappings]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <Link
          href="/app/marketing"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> 마케팅 대시보드
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Database className="w-6 h-6 text-brand" />
          KAMIS 매핑
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          자사 상품을 KAMIS 농산물유통정보(부류·품목·품종) 코드와 연결하면 일별 도·소매 시세를 자동으로 받아올 수 있습니다.
        </p>
      </div>

      {notice && (
        <div
          className={`text-sm rounded-lg px-3 py-2 border ${
            notice.type === "ok"
              ? "bg-brand-muted text-brand border-brand/20"
              : "bg-red-50 text-red-600 border-red-100"
          }`}
        >
          {notice.msg}
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        {/* 목록 */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">
              매핑 목록 ({mappings.length}) · 활성 {activeCount}
            </div>
            <button onClick={resetForm} className="text-xs text-brand font-medium hover:underline">
              + 새 매핑
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
            </div>
          ) : mappings.length === 0 ? (
            <div className="text-sm text-gray-400 bg-white border border-gray-100 rounded-xl p-6 text-center">
              아직 매핑이 없습니다. 우측에서 새 매핑을 추가하세요.
            </div>
          ) : (
            <div className="space-y-2">
              {mappings.map((m) => (
                <div
                  key={m.id}
                  className={`bg-white rounded-xl border p-4 ${
                    editId === m.id ? "border-brand/40" : "border-gray-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button onClick={() => startEdit(m)} className="text-left min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{m.productName}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {m.categoryName} · {m.itemName}
                        {m.kindName ? ` · ${m.kindName}` : ""}
                        <span className="text-gray-400 ml-1">
                          ({m.categoryCode}/{m.itemCode}{m.kindCode ? `/${m.kindCode}` : ""})
                        </span>
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(m.createdAt)}</p>
                    </button>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => toggleActive(m)}
                        className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          m.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        {m.isActive ? "활성" : "비활성"}
                      </button>
                      <button
                        onClick={() => remove(m.id)}
                        className="text-gray-300 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 폼 */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
              <LinkIcon className="w-4 h-4 text-brand" />
              {editId ? "매핑 수정" : "새 KAMIS 매핑"}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                상품명 <span className="text-red-500">*</span>
              </label>
              <input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="예: 성주 꿀 샤인머스캣 2kg"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                부류 (Category) <span className="text-red-500">*</span>
              </label>
              <select
                value={categoryCode}
                onChange={(e) => {
                  setCategoryCode(e.target.value);
                  setItemCode("");
                  setKindCode("");
                }}
                className={inputCls}
              >
                <option value="">부류 선택</option>
                {KAMIS_CATEGORIES.map((c) => (
                  <option key={c.code} value={c.code}>[{c.code}] {c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                품목 (Item) <span className="text-red-500">*</span>
              </label>
              <select
                value={itemCode}
                onChange={(e) => {
                  setItemCode(e.target.value);
                  setKindCode("");
                }}
                disabled={!categoryCode || itemOptions.length === 0}
                className={inputCls}
              >
                <option value="">품목 선택</option>
                {itemOptions.map((i) => (
                  <option key={i.code} value={i.code}>[{i.code}] {i.name}</option>
                ))}
              </select>
              {categoryCode && itemOptions.length === 0 && (
                <p className="text-[11px] text-gray-500 mt-1">이 부류에 사전 정의된 품목이 없습니다.</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">품종 (Kind)</label>
              <select
                value={kindCode}
                onChange={(e) => setKindCode(e.target.value)}
                disabled={!itemCode || kindOptions.length === 0}
                className={inputCls}
              >
                <option value="">품종 선택 (선택사항)</option>
                {kindOptions.map((k) => (
                  <option key={k.code} value={k.code}>[{k.code}] {k.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">등급 (Rank)</label>
              <div className="flex gap-2">
                {RANK_CODES.map((r) => (
                  <button
                    key={r.code}
                    type="button"
                    onClick={() => setRankCode(r.code)}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      rankCode === r.code
                        ? "bg-brand-muted text-brand border-brand/40"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    [{r.code}] {r.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={testPrice}
                disabled={!categoryCode || !itemCode || testing}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-white border border-brand/30 text-brand hover:bg-brand-muted px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                시세 조회 테스트
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editId ? "매핑 수정" : "매핑 저장"}
              </button>
            </div>

            {priceResult && <PriceResultPanel data={priceResult} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function PriceResultPanel({ data }: { data: PriceResult }) {
  const items = Array.isArray(data.items) ? data.items : [];
  const period = data.period || {};
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
          <TrendingUp className="w-4 h-4 text-brand" /> KAMIS 시세 조회 결과
        </div>
        {period.startday && period.endday && (
          <span className="text-[10px] text-gray-400">{period.startday} ~ {period.endday}</span>
        )}
      </div>
      {!data.ok ? (
        <p className="text-xs text-red-600">
          {data.errorMsg || `KAMIS 응답 오류 (code: ${data.errorCode || "unknown"})`}
        </p>
      ) : items.length === 0 ? (
        <p className="text-xs text-gray-500">해당 기간의 시세 데이터가 없습니다.</p>
      ) : (
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {items.slice(0, 15).map((it, i) => {
            const price = it.price || it.dpr1 || "";
            const numPrice = Number(String(price).replace(/[^0-9.-]/g, ""));
            return (
              <div
                key={i}
                className="bg-white border border-gray-100 rounded-lg px-3 py-2 text-xs flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-gray-800 truncate">
                    {it.itemname || it.item_name || "품목"}
                    {(it.kindname || it.kind_name) && ` · ${it.kindname || it.kind_name}`}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {it.regday || it.date || ""} {it.countyname || it.county_name || ""}
                  </div>
                </div>
                <div className="font-bold text-brand-dark whitespace-nowrap">
                  {numPrice ? numPrice.toLocaleString() : price || "-"}
                  <span className="text-[10px] text-gray-400 ml-0.5">원</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
