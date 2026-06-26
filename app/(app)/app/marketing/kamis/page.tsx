"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Database, Check, AlertCircle, Save, Loader2, Package, Search,
  RefreshCw, Link as LinkIcon, TrendingUp, ArrowLeft, ArrowRight, Trash2, Power,
} from "lucide-react";

// ── KAMIS 코드 데이터 (KamisMapping.jsx에서 verbatim 이식) ──────────────
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
    { code: "417", name: "자두" },
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
  analysisId?: string | null;
  categoryCode: string;
  categoryName?: string | null;
  itemCode: string;
  itemName?: string | null;
  kindCode?: string | null;
  kindName?: string | null;
  rankCode?: string | null;
  isActive: boolean;
}

interface ProductRow {
  name: string;
  analysisId: string | null;
  category: string;
}

interface PriceResult {
  ok: boolean;
  errorCode?: string | null;
  errorMsg?: string | null;
  period?: { startday?: string; endday?: string };
  items?: Record<string, string>[];
}

interface FormState {
  categoryCode: string;
  itemCode: string;
  kindCode: string;
  rankCode: string;
}

interface Notification {
  type: "success" | "error";
  msg: string;
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function KamisMappingPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);
  const [form, setForm] = useState<FormState>({
    categoryCode: "400",
    itemCode: "",
    kindCode: "",
    rankCode: "04",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [notification, setNotification] = useState<Notification | null>(null);
  const [testing, setTesting] = useState(false);
  const [priceResult, setPriceResult] = useState<PriceResult | null>(null);

  const showNotice = (type: "success" | "error", msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3500);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const findMapping = (productName: string, list: Mapping[]): Mapping | undefined =>
    list.find((m) => String(m.productName || "").trim() === productName);

  const selectProductInternal = (product: ProductRow, mList: Mapping[]) => {
    setSelectedProduct(product);
    setPriceResult(null);
    const existing = findMapping(product.name, mList);
    if (existing) {
      setForm({
        categoryCode: existing.categoryCode || "400",
        itemCode: existing.itemCode || "",
        kindCode: existing.kindCode || "",
        rankCode: existing.rankCode || "04",
      });
    } else {
      setForm({ categoryCode: "400", itemCode: "", kindCode: "", rankCode: "04" });
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [aRes, mRes] = await Promise.all([
        fetch("/api/marketing/analyses?pageSize=100"),
        fetch("/api/marketing/kamis-mappings"),
      ]);
      const aJson = await aRes.json();
      const mJson = await mRes.json();
      const aList: { id: string; productName?: string | null; category?: string | null }[] = aJson?.data || [];
      const mList: Mapping[] = mJson?.data || [];

      const list: ProductRow[] = [];
      const seen = new Set<string>();
      aList.forEach((a) => {
        const name = String(a.productName || "").trim();
        if (name && !seen.has(name)) {
          seen.add(name);
          list.push({ name, analysisId: a.id, category: a.category || "" });
        }
      });
      mList.forEach((m) => {
        const name = String(m.productName || "").trim();
        if (name && !seen.has(name)) {
          seen.add(name);
          list.push({ name, analysisId: m.analysisId || null, category: "" });
        }
      });
      setProducts(list);
      setMappings(mList);
      if (list.length > 0 && !selectedProduct) {
        selectProductInternal(list[0], mList);
      }
    } catch (e) {
      console.error(e);
      showNotice("error", "데이터를 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedProduct) return;
    if (!form.categoryCode || !form.itemCode) {
      showNotice("error", "부류와 품목 코드는 필수입니다");
      return;
    }
    setSaving(true);
    try {
      const category = KAMIS_CATEGORIES.find((c) => c.code === form.categoryCode);
      const items = KAMIS_ITEMS[form.categoryCode] || [];
      const item = items.find((i) => i.code === form.itemCode);
      const kinds = KAMIS_KINDS[form.itemCode] || [];
      const kind = kinds.find((k) => k.code === form.kindCode);
      const payload = {
        productName: selectedProduct.name,
        analysisId: selectedProduct.analysisId || null,
        categoryCode: form.categoryCode,
        categoryName: category?.name || "",
        itemCode: form.itemCode,
        itemName: item?.name || "",
        kindCode: form.kindCode || undefined,
        kindName: kind?.name || "",
        rankCode: form.rankCode || "04",
        isActive: true,
      };
      const existing = findMapping(selectedProduct.name, mappings);
      const res = existing
        ? await fetch(`/api/marketing/kamis-mappings/${existing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/marketing/kamis-mappings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) throw new Error("저장 실패");
      showNotice("success", "매핑이 저장되었습니다");
      await loadData();
    } catch (e) {
      showNotice("error", e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (mapping: Mapping) => {
    const res = await fetch(`/api/marketing/kamis-mappings/${mapping.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !mapping.isActive }),
    });
    if (res.ok) {
      setMappings((prev) => prev.map((m) => (m.id === mapping.id ? { ...m, isActive: !m.isActive } : m)));
      showNotice("success", `매핑을 ${mapping.isActive ? "비활성화" : "활성화"}했습니다`);
    } else {
      showNotice("error", "상태 변경에 실패했습니다");
    }
  };

  const handleDelete = async (mapping: Mapping) => {
    if (!confirm(`'${mapping.productName}' 매핑을 삭제할까요?`)) return;
    const res = await fetch(`/api/marketing/kamis-mappings/${mapping.id}`, { method: "DELETE" });
    if (res.ok) {
      showNotice("success", "매핑을 삭제했습니다");
      await loadData();
      if (selectedProduct?.name === mapping.productName) {
        setForm({ categoryCode: "400", itemCode: "", kindCode: "", rankCode: "04" });
      }
    } else {
      showNotice("error", "삭제에 실패했습니다");
    }
  };

  const handleTestFetch = async () => {
    if (!form.categoryCode || !form.itemCode) {
      showNotice("error", "먼저 부류·품목을 선택해 주세요");
      return;
    }
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
          categoryCode: form.categoryCode,
          itemCode: form.itemCode,
          kindCode: form.kindCode || undefined,
          productClsCode: "01",
          rankCode: form.rankCode || "04",
          countryCode: "1101",
          convertKgYn: "N",
        }),
      });
      if (res.status === 503) {
        showNotice("error", "KAMIS 인증키가 설정되지 않았습니다 — 환경변수를 확인해 주세요");
        return;
      }
      const data = (await res.json()) as PriceResult;
      setPriceResult(data);
      if (data.ok) {
        showNotice("success", `KAMIS 응답 수신 (${data.items?.length || 0}건)`);
      } else {
        const detail = data.errorMsg || `code: ${data.errorCode || "unknown"}`;
        showNotice("error", `KAMIS 응답 오류 — ${detail}`);
      }
    } catch (e) {
      showNotice("error", e instanceof Error ? e.message : "KAMIS 조회 실패");
    } finally {
      setTesting(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, searchInput]);

  const mappedCount = useMemo(
    () => products.filter((p) => findMapping(p.name, mappings)).length,
    [products, mappings],
  );

  const itemOptions = KAMIS_ITEMS[form.categoryCode] || [];
  const kindOptions = KAMIS_KINDS[form.itemCode] || [];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-20 right-4 z-50 max-w-xs p-3.5 rounded-xl shadow-lg text-sm font-medium border ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-start gap-2">
            {notification.type === "success" ? (
              <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            )}
            <span>{notification.msg}</span>
          </div>
        </div>
      )}

      <div className="mb-6">
        <Link
          href="/app/marketing"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> 마케팅 대시보드
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              데이터 설정 · 상품-KAMIS 품목 매핑
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              자사 상품을 KAMIS 농산물유통정보(부류·품목·품종) 코드와 연결하면
              일별 도·소매 시세를 자동으로 받아올 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard label="전체 상품" value={products.length} icon={Package} color="text-slate-900" iconBg="bg-slate-100" iconColor="text-slate-600" />
        <StatCard label="매핑 완료" value={mappedCount} icon={Check} color="text-emerald-700" iconBg="bg-emerald-100" iconColor="text-emerald-600" />
        <StatCard label="매핑 필요" value={Math.max(0, products.length - mappedCount)} icon={AlertCircle} color="text-amber-700" iconBg="bg-amber-100" iconColor="text-amber-600" />
      </div>

      {/* 안내문구 — 매핑이 어디에 쓰이는지 + 다음 단계 */}
      <div className="mb-5 rounded-2xl border border-cyan-200 bg-cyan-50/50 p-4">
        <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-800 uppercase tracking-wider mb-2">
          <LinkIcon className="w-3.5 h-3.5" />
          매핑은 이렇게 쓰여요
        </div>
        <ol className="space-y-1 text-xs text-slate-700 leading-relaxed list-decimal list-inside">
          <li>좌측에서 <b>자사 상품</b>을 고르고, 우측에서 KAMIS <b>부류·품목</b>을 연결해 <b>매핑 저장</b>합니다.</li>
          <li>매핑하면 <b>새 분석</b>과 <b>수요 예측</b>에서 그 상품의 KAMIS 시세를 <b>자동으로 불러와</b> 가격 포지셔닝·발주 신호에 반영합니다.</li>
          <li><b>선물세트</b>는 KAMIS에 단일 품목이 없어, <b>대표 원물</b>(예: 샤인머스캣 선물세트 → 포도)을 골라 매핑하세요.</li>
        </ol>
        <div className="mt-2.5 flex flex-wrap gap-2">
          <Link href="/app/marketing/new" className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-700 hover:text-cyan-900">
            새 분석으로 가기 <ArrowRight className="w-3 h-3" />
          </Link>
          <Link href="/app/marketing/forecast" className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-700 hover:text-cyan-900">
            수요 예측으로 가기 <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: 자사 상품 목록 */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/60">
              <div className="text-xs font-semibold text-slate-700 mb-2">
                자사 상품 ({filteredProducts.length})
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="상품명 검색..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-200 bg-white text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>
            <div className="max-h-[640px] overflow-y-auto divide-y divide-stone-100">
              {loading && products.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                  불러오는 중...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  표시할 상품이 없습니다.<br />
                  먼저 새 분석을 만들어 상품을 등록해 주세요.
                </div>
              ) : (
                filteredProducts.map((p, i) => {
                  const mapping = findMapping(p.name, mappings);
                  const active = selectedProduct?.name === p.name;
                  return (
                    <div
                      key={`${p.name}-${i}`}
                      className={`w-full transition-all border-l-4 ${
                        active ? "bg-emerald-50 border-emerald-500" : "border-transparent hover:bg-stone-50"
                      }`}
                    >
                      <div className="flex items-start gap-2 px-4 py-3">
                        <button
                          type="button"
                          onClick={() => selectProductInternal(p, mappings)}
                          className="flex items-start gap-2 text-left min-w-0 flex-1"
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {mapping ? (
                              <span className="text-emerald-600 text-sm leading-none">✅</span>
                            ) : (
                              <span className="text-amber-500 text-sm leading-none">⚠️</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-slate-900 truncate">{p.name}</div>
                            {mapping ? (
                              <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                                {mapping.categoryName} · {mapping.itemName}
                                {mapping.kindName ? ` · ${mapping.kindName}` : ""}
                                <span className="ml-1 text-slate-400">
                                  ({mapping.categoryCode}/{mapping.itemCode}
                                  {mapping.kindCode ? `/${mapping.kindCode}` : ""})
                                </span>
                              </div>
                            ) : (
                              <div className="text-[11px] text-amber-600 mt-0.5">매핑 필요</div>
                            )}
                          </div>
                        </button>
                        {mapping && (
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleActive(mapping)}
                              className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                mapping.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              <Power className="w-3 h-3" />
                              {mapping.isActive ? "활성" : "비활성"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(mapping)}
                              className="text-slate-300 hover:text-red-500"
                              aria-label="매핑 삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: KAMIS 코드 매핑 폼 */}
        <div className="lg:col-span-3">
          {!selectedProduct ? (
            <div className="bg-white border-2 border-dashed border-stone-300 rounded-2xl p-10 text-center">
              <LinkIcon className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">
                좌측에서 상품을 선택해 KAMIS 코드를 매핑하세요.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100 bg-gradient-to-r from-emerald-50 to-cyan-50">
                <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold uppercase tracking-wider mb-1">
                  <LinkIcon className="w-3.5 h-3.5" />
                  KAMIS 코드 매핑
                </div>
                <h3 className="text-lg font-bold text-slate-900">{selectedProduct.name}</h3>
              </div>
              <div className="p-5 space-y-4" role="form" aria-label="KAMIS 매핑 폼">
                {(selectedProduct.category === "giftset" ||
                  /선물\s*세트|세트/.test(selectedProduct.name)) && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800 leading-relaxed flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>
                      <b>선물세트</b>는 KAMIS에 단일 품목이 없어 직접 비교가 안 됩니다. 구성의{" "}
                      <b>대표 원물</b>(예: 샤인머스캣 선물세트 → 포도/샤인머스캣)을 부류·품목으로
                      골라 매핑하세요. 시세는 그 원물 기준으로 조회됩니다.
                    </span>
                  </div>
                )}
                <FormField label="부류 (Category)" required>
                  <select
                    value={form.categoryCode}
                    onChange={(e) => setForm({ ...form, categoryCode: e.target.value, itemCode: "", kindCode: "" })}
                    className="w-full px-3 py-2.5 rounded-lg border border-stone-300 bg-white text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="">부류 선택</option>
                    {KAMIS_CATEGORIES.map((c) => (
                      <option key={c.code} value={c.code}>[{c.code}] {c.name}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="품목 (Item)" required>
                  <select
                    value={form.itemCode}
                    onChange={(e) => setForm({ ...form, itemCode: e.target.value, kindCode: "" })}
                    disabled={!form.categoryCode || itemOptions.length === 0}
                    className="w-full px-3 py-2.5 rounded-lg border border-stone-300 bg-white text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-stone-50 disabled:text-slate-400"
                  >
                    <option value="">품목 선택</option>
                    {itemOptions.map((i) => (
                      <option key={i.code} value={i.code}>[{i.code}] {i.name}</option>
                    ))}
                  </select>
                  {form.categoryCode && itemOptions.length === 0 && (
                    <p className="text-[11px] text-slate-500 mt-1">이 부류에 사전 정의된 품목이 없습니다.</p>
                  )}
                </FormField>

                <FormField label="품종 (Kind)">
                  <select
                    value={form.kindCode}
                    onChange={(e) => setForm({ ...form, kindCode: e.target.value })}
                    disabled={!form.itemCode || kindOptions.length === 0}
                    className="w-full px-3 py-2.5 rounded-lg border border-stone-300 bg-white text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-stone-50 disabled:text-slate-400"
                  >
                    <option value="">품종 선택 (선택사항)</option>
                    {kindOptions.map((k) => (
                      <option key={k.code} value={k.code}>[{k.code}] {k.name}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="등급 (Rank)">
                  <div className="flex gap-2">
                    {RANK_CODES.map((r) => {
                      const active = form.rankCode === r.code;
                      return (
                        <button
                          key={r.code}
                          type="button"
                          onClick={() => setForm({ ...form, rankCode: r.code })}
                          className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                            active
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : "bg-white text-slate-700 border-stone-200 hover:border-stone-300"
                          }`}
                        >
                          [{r.code}] {r.name}
                        </button>
                      );
                    })}
                  </div>
                </FormField>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={handleTestFetch}
                    disabled={!form.categoryCode || !form.itemCode || testing}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    <span>KAMIS 가격 조회 테스트</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!form.categoryCode || !form.itemCode || saving}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-[#15803D] hover:bg-[#166534] text-white px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>매핑 저장</span>
                  </button>
                </div>

                {priceResult && <PriceResultPanel data={priceResult} />}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  iconBg,
  iconColor,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-3 md:p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <span className="text-xs text-slate-500 font-medium">{label}</span>
      </div>
      <div className={`text-xl md:text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function PriceResultPanel({ data }: { data: PriceResult }) {
  const items = Array.isArray(data?.items) ? data.items : [];
  const errorCode = data?.errorCode;
  const ok = data?.ok;
  const period = data?.period || {};
  return (
    <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            KAMIS 가격 조회 결과
          </h4>
        </div>
        {period.startday && period.endday && (
          <span className="text-[10px] text-slate-500">{period.startday} ~ {period.endday}</span>
        )}
      </div>
      {!ok ? (
        <p className="text-xs text-red-600">
          {data.errorMsg || `KAMIS 응답 오류 (code: ${errorCode || "unknown"}). 인증키/사용자 ID가 올바른지 확인해 주세요.`}
        </p>
      ) : items.length === 0 ? (
        <p className="text-xs text-slate-500">해당 기간의 가격 데이터가 없습니다.</p>
      ) : (
        <div className="space-y-1.5 max-h-56 overflow-y-auto">
          {items.slice(0, 12).map((it, i) => {
            const price = it.price || it.dpr1 || "";
            const numPrice = Number(String(price).replace(/[^0-9.-]/g, ""));
            return (
              <div key={i} className="bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800 truncate">
                    {it.itemname || it.item_name || it.productName || "품목"}
                    {(it.kindname || it.kind_name) && ` · ${it.kindname || it.kind_name}`}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {it.regday || it.date || ""} {it.countyname || it.county_name || ""}
                  </div>
                </div>
                <div className="font-bold text-emerald-700 whitespace-nowrap">
                  {numPrice ? numPrice.toLocaleString() : price || "-"}
                  <span className="text-[10px] text-slate-500 ml-0.5">원</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <details className="mt-2">
        <summary className="text-[10px] text-slate-400 cursor-pointer hover:text-slate-600">원본 응답 보기</summary>
        <pre className="mt-1 text-[10px] text-slate-600 bg-white p-2 rounded border border-stone-200 max-h-40 overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
}
