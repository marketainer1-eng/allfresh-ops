"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Package,
  X,
  Trash2,
  Calendar,
  Copy,
  Loader2,
  Apple,
  Gift,
  Repeat,
  AlertCircle,
  Check,
  ShoppingBag,
  Target,
} from "lucide-react";

interface ChannelRec {
  channel: string;
  priority: string;
  reasoning?: string;
}

interface Analysis {
  id: string;
  productName: string;
  category: string;
  status: string;
  thumbnailUrl: string | null;
  targetCustomer: string | null;
  marketingCopy: string | null;
  seoKeywords: string[] | null;
  seasonalCampaign: string | null;
  hashtags: string[] | null;
  pricePositioning: string | null;
  differentiation: string | null;
  recommendedChannels: ChannelRec[] | null;
  attributes: Record<string, string> | null;
  createdAt: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  single: "단품 과일",
  giftset: "선물세트",
  subscription: "구독 서비스",
};
const CATEGORY_COLOR: Record<string, string> = {
  single: "#15803D",
  giftset: "#B45309",
  subscription: "#0E7490",
};
const CATEGORY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  single: Apple,
  giftset: Gift,
  subscription: Repeat,
};
const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  processing: "진행중",
  completed: "완료",
  failed: "실패",
};

const ATTR_LABEL: Record<string, string> = {
  sweetness: "당도",
  origin: "산지",
  season: "제철",
  storage: "보관법",
  grade: "등급",
};

const PRIORITY_STYLE: Record<string, { label: string; cls: string }> = {
  high: { label: "최우선", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  medium: { label: "권장", cls: "bg-amber-100 text-amber-800 border-amber-200" },
  low: { label: "보조", cls: "bg-stone-100 text-stone-700 border-stone-200" },
};

function HistoryInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusId = searchParams.get("focus");

  const [data, setData] = useState<Analysis[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const isComposingRef = useRef(false);
  const [selected, setSelected] = useState<Analysis | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; msg: string } | null>(
    null,
  );
  const loaderRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const showNotice = (type: "success" | "error", msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchData = useCallback(
    async (pageNum: number, reset: boolean, searchTerm: string, category: string) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(pageNum), pageSize: "12" });
        if (searchTerm) params.set("search", searchTerm);
        if (category !== "all") params.set("category", category);
        const res = await fetch(`/api/marketing/analyses?${params}`);
        const json = await res.json();
        const items: Analysis[] = json?.data || [];
        const totalPages: number = json?.totalPages || 1;
        setData((prev) => (reset ? items : [...prev, ...items]));
        setHasMore(pageNum < totalPages);
      } catch (e) {
        console.error("Failed to fetch analyses:", e);
        showNotice("error", "데이터를 불러오지 못했습니다");
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [],
  );

  // Debounce search input
  useEffect(() => {
    if (isComposingRef.current) return;
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset list when search/filter changes
  useEffect(() => {
    setData([]);
    setHasMore(true);
    setPage(1);
    fetchData(1, true, search, filterCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterCategory]);

  // Infinite scroll
  useEffect(() => {
    if (!loaderRef.current || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loadingRef.current) {
        setPage((p) => {
          const next = p + 1;
          fetchData(next, false, search, filterCategory);
          return next;
        });
      }
    });
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, search, filterCategory, fetchData]);

  // Auto-open detail when ?focus= is provided
  useEffect(() => {
    if (!focusId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/marketing/analyses/${focusId}`);
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setSelected(json as Analysis);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [focusId]);

  const handleDelete = async (id: string) => {
    if (!confirm("이 분석 이력을 삭제하시겠습니까?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/marketing/analyses/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || "삭제에 실패했습니다");
      }
      setData((prev) => prev.filter((d) => d.id !== id));
      setSelected(null);
      showNotice("success", "삭제되었습니다");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "삭제에 실패했습니다";
      showNotice("error", msg);
    } finally {
      setDeleting(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text || "").then(
      () => showNotice("success", "복사되었습니다"),
      () => showNotice("error", "복사 실패"),
    );
  };

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
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">분석 이력</h2>
        <p className="text-sm text-slate-600 mt-1">저장된 모든 AI 분석 결과를 검색하고 관리합니다.</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-stone-200 rounded-2xl p-3 md:p-4 mb-5 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onCompositionStart={() => {
                isComposingRef.current = true;
              }}
              onCompositionEnd={(e) => {
                isComposingRef.current = false;
                setSearchInput((e.target as HTMLInputElement).value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing && !isComposingRef.current) {
                  setSearch(searchInput);
                }
              }}
              placeholder="상품명으로 검색..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm bg-stone-50"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 md:mx-0 md:px-0">
            {[
              { key: "all", label: "전체" },
              { key: "single", label: "단품" },
              { key: "giftset", label: "선물세트" },
              { key: "subscription", label: "구독" },
            ].map((f) => {
              const active = filterCategory === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilterCategory(f.key)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    active ? "bg-[#15803D] text-white" : "bg-stone-100 text-slate-700 hover:bg-stone-200"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading && data.length === 0 ? (
        <SkeletonGrid />
      ) : data.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
          <Package className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700 mb-1">분석 이력이 없습니다</h3>
          <p className="text-sm text-slate-500">새 분석을 만들어 인사이트를 도출해 보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {data.map((a) => {
            const Icon = CATEGORY_ICON[a.category] || Package;
            return (
              <button
                key={a.id}
                onClick={() => setSelected(a)}
                className="text-left bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-md hover:border-emerald-200 transition-all group"
              >
                <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden">
                  {a.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.thumbnailUrl}
                      alt={a.productName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                      <Icon className="w-10 h-10" />
                    </div>
                  )}
                  <span
                    className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-1 rounded text-white shadow-sm"
                    style={{ backgroundColor: CATEGORY_COLOR[a.category] }}
                  >
                    {CATEGORY_LABEL[a.category]}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug mb-2">
                    {a.productName}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                    {a.targetCustomer || "타깃 정보 없음"}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(a.createdAt)}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        a.status === "completed"
                          ? "bg-emerald-100 text-emerald-700"
                          : a.status === "processing"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {STATUS_LABEL[a.status] || "대기"}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {hasMore && data.length > 0 && (
        <div ref={loaderRef} className="py-8 text-center text-sm text-slate-400">
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> 더 불러오는 중...
            </span>
          ) : (
            "스크롤하여 더 보기"
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <DetailModal
          analysis={selected}
          onClose={() => setSelected(null)}
          onDelete={() => handleDelete(selected.id)}
          onCopy={handleCopy}
          onContinueToStrategy={() => {
            router.push(`/app/marketing/strategy?analysisId=${selected.id}`);
          }}
          deleting={deleting}
        />
      )}
    </div>
  );
}

export default function History() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      }
    >
      <HistoryInner />
    </Suspense>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-stone-200 rounded-2xl overflow-hidden animate-pulse"
        >
          <div className="aspect-[4/3] bg-stone-100" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-stone-100 rounded w-3/4" />
            <div className="h-3 bg-stone-100 rounded w-full" />
            <div className="h-3 bg-stone-100 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailModal({
  analysis,
  onClose,
  onDelete,
  onCopy,
  onContinueToStrategy,
  deleting,
}: {
  analysis: Analysis;
  onClose: () => void;
  onDelete: () => void;
  onCopy: (text: string) => void;
  onContinueToStrategy: () => void;
  deleting: boolean;
}) {
  const Icon = CATEGORY_ICON[analysis.category] || Package;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full md:max-w-3xl max-h-[90vh] rounded-t-2xl md:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-stone-200 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: `${CATEGORY_COLOR[analysis.category]}15`,
                color: CATEGORY_COLOR[analysis.category],
              }}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-900 truncate">{analysis.productName}</h3>
              <p className="text-xs text-slate-500">
                {CATEGORY_LABEL[analysis.category]} · {formatDate(analysis.createdAt)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-stone-100 text-slate-500 flex-shrink-0"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-5">
          {analysis.thumbnailUrl && (
            <div className="rounded-xl overflow-hidden bg-stone-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={analysis.thumbnailUrl}
                alt={analysis.productName}
                className="w-full h-auto max-h-64 object-cover"
              />
            </div>
          )}

          {/* Attributes */}
          {analysis.category === "single" &&
            analysis.attributes &&
            Object.keys(analysis.attributes || {}).length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  품목 속성
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(analysis.attributes).map(([k, v]) =>
                    v ? (
                      <div key={k} className="bg-stone-50 rounded-lg px-3 py-2 border border-stone-100">
                        <div className="text-[10px] text-slate-500 uppercase">{ATTR_LABEL[k] || k}</div>
                        <div className="text-xs font-semibold text-slate-800 mt-0.5">{v}</div>
                      </div>
                    ) : null,
                  )}
                </div>
              </div>
            )}

          <DetailBlock label="타깃 고객 페르소나" content={analysis.targetCustomer} onCopy={onCopy} />
          <DetailBlock label="마케팅 카피" content={analysis.marketingCopy} onCopy={onCopy} />

          {analysis.seoKeywords && analysis.seoKeywords.length > 0 && (
            <div>
              <BlockHeader label="SEO 키워드" onCopy={() => onCopy(analysis.seoKeywords!.join(", "))} />
              <div className="flex flex-wrap gap-1.5">
                {analysis.seoKeywords.map((k, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-medium border border-emerald-100"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}

          <DetailBlock label="시즌 캠페인 제안" content={analysis.seasonalCampaign} onCopy={onCopy} />

          {analysis.hashtags && analysis.hashtags.length > 0 && (
            <div>
              <BlockHeader label="추천 해시태그" onCopy={() => onCopy(analysis.hashtags!.join(" "))} />
              <div className="flex flex-wrap gap-1.5">
                {analysis.hashtags.map((t, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md text-xs font-medium border border-amber-100"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(analysis.pricePositioning ||
            analysis.differentiation ||
            (analysis.recommendedChannels && analysis.recommendedChannels.length > 0)) && (
            <div className="pt-4 border-t border-stone-200">
              <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" />
                판매 전략
              </h4>
              <div className="space-y-5">
                <DetailBlock label="가격 포지셔닝 제안" content={analysis.pricePositioning} onCopy={onCopy} />
                <DetailBlock label="경쟁상품 대비 차별점" content={analysis.differentiation} onCopy={onCopy} />
                {analysis.recommendedChannels && analysis.recommendedChannels.length > 0 && (
                  <div>
                    <BlockHeader
                      label="추천 판매 채널"
                      onCopy={() =>
                        onCopy(
                          analysis
                            .recommendedChannels!.map(
                              (c) =>
                                `[${c.channel}] (${
                                  (PRIORITY_STYLE[c.priority] || PRIORITY_STYLE.medium).label
                                }) ${c.reasoning || ""}`,
                            )
                            .join("\n"),
                        )
                      }
                    />
                    <div className="space-y-2">
                      {analysis.recommendedChannels.map((c, i) => {
                        const ps = PRIORITY_STYLE[c.priority] || PRIORITY_STYLE.medium;
                        return (
                          <div key={i} className="bg-stone-50 rounded-lg p-3 border border-stone-100">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                                <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                                <span>{c.channel}</span>
                              </div>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${ps.cls}`}
                              >
                                {ps.label}
                              </span>
                            </div>
                            {c.reasoning && (
                              <p className="text-xs text-slate-600 leading-relaxed">{c.reasoning}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-stone-200 p-4 flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            <span>삭제</span>
          </button>
          <div className="flex items-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial bg-stone-100 hover:bg-stone-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={onContinueToStrategy}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-[#15803D] hover:bg-[#166534] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              <Target className="w-4 h-4" />
              <span>전략 분석으로 이어가기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlockHeader({ label, onCopy }: { label: string; onCopy: () => void }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{label}</h4>
      <button
        type="button"
        onClick={onCopy}
        className="text-xs text-slate-400 hover:text-emerald-700 flex items-center gap-1"
      >
        <Copy className="w-3 h-3" /> 복사
      </button>
    </div>
  );
}

function DetailBlock({
  label,
  content,
  onCopy,
}: {
  label: string;
  content: string | null;
  onCopy: (text: string) => void;
}) {
  if (!content) return null;
  return (
    <div>
      <BlockHeader label={label} onCopy={() => onCopy(content)} />
      <p className="text-sm text-slate-700 leading-relaxed bg-stone-50 rounded-lg p-3 whitespace-pre-wrap">
        {content}
      </p>
    </div>
  );
}

function formatDate(s: string | null | undefined): string {
  if (!s) return "-";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
