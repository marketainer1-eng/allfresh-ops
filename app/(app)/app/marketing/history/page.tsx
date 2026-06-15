"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  History, Search, Loader2, Plus, Trash2, X, Tag, Hash,
  Target, Megaphone, TrendingUp, Award, Store, Sparkles,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Analysis {
  id: string;
  productName: string;
  category: string;
  productInfo: string | null;
  targetCustomer: string | null;
  marketingCopy: string | null;
  seoKeywords: string[] | null;
  seasonalCampaign: string | null;
  hashtags: string[] | null;
  pricePositioning: string | null;
  differentiation: string | null;
  recommendedChannels: { channel: string; priority: string; reasoning: string }[] | null;
  createdAt: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  single: "단품",
  giftset: "선물세트",
  subscription: "구독",
};
const CATEGORY_BADGE: Record<string, string> = {
  single: "bg-green-100 text-green-700",
  giftset: "bg-purple-100 text-purple-700",
  subscription: "bg-blue-100 text-blue-700",
};
const FILTERS = [
  { value: "all", label: "전체" },
  { value: "single", label: "단품" },
  { value: "giftset", label: "선물세트" },
  { value: "subscription", label: "구독" },
];

export default function MarketingHistoryPage() {
  const [items, setItems] = useState<Analysis[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Analysis | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(
    async (opts: { page: number; search: string; category: string; append: boolean }) => {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(opts.page),
        pageSize: "12",
      });
      if (opts.search) params.set("search", opts.search);
      if (opts.category !== "all") params.set("category", opts.category);
      const res = await fetch(`/api/marketing/analyses?${params}`);
      const json = await res.json();
      setItems((prev) => (opts.append ? [...prev, ...json.data] : json.data));
      setTotalPages(json.totalPages);
      setTotal(json.total);
      setLoading(false);
    },
    [],
  );

  // 검색/필터 변경 시 디바운스 후 1페이지부터 재조회
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load({ page: 1, search, category, append: false });
    }, 300);
    return () => clearTimeout(t);
  }, [search, category, load]);

  function loadMore() {
    const next = page + 1;
    setPage(next);
    load({ page: next, search, category, append: true });
  }

  async function handleDelete(id: string) {
    if (!confirm("이 분석을 삭제할까요?")) return;
    setDeleting(id);
    const res = await fetch(`/api/marketing/analyses/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      setTotal((t) => Math.max(0, t - 1));
      if (selected?.id === id) setSelected(null);
    }
    setDeleting(null);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <History className="w-6 h-6 text-brand" />
            분석 이력
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            저장된 마케팅 분석 {total}건. 카드를 눌러 상세 결과를 확인하세요.
          </p>
        </div>
        <Link
          href="/app/marketing/new"
          className="inline-flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          새 분석
        </Link>
      </div>

      {/* 검색 + 필터 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="상품명으로 검색"
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          />
        </div>
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setCategory(f.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                category === f.value
                  ? "bg-brand text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 목록 */}
      {loading && items.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Sparkles className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          <p className="text-sm">아직 저장된 분석이 없습니다.</p>
          <Link href="/app/marketing/new" className="text-sm text-brand font-medium mt-2 inline-block">
            첫 분석 시작하기 →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelected(a)}
                className="text-left bg-white rounded-xl border border-gray-100 p-5 hover:border-brand/40 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                      CATEGORY_BADGE[a.category] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {CATEGORY_LABEL[a.category] ?? a.category}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(a.createdAt)}</span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1.5 line-clamp-1">
                  {a.productName}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                  {a.marketingCopy ?? a.targetCustomer ?? "—"}
                </p>
                {a.seoKeywords && a.seoKeywords.length > 0 && (
                  <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
                    <Tag className="w-3 h-3" />
                    키워드 {a.seoKeywords.length} · 채널 {a.recommendedChannels?.length ?? 0}
                  </div>
                )}
              </button>
            ))}
          </div>

          {page < totalPages && (
            <div className="flex justify-center pt-2">
              <button
                onClick={loadMore}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                더 보기
              </button>
            </div>
          )}
        </>
      )}

      {/* 상세 모달 */}
      {selected && (
        <DetailModal
          analysis={selected}
          onClose={() => setSelected(null)}
          onDelete={() => handleDelete(selected.id)}
          deleting={deleting === selected.id}
        />
      )}
    </div>
  );
}

function DetailModal({
  analysis,
  onClose,
  onDelete,
  deleting,
}: {
  analysis: Analysis;
  onClose: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded ${
                CATEGORY_BADGE[analysis.category] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {CATEGORY_LABEL[analysis.category] ?? analysis.category}
            </span>
            <h2 className="text-lg font-bold text-gray-900 mt-1">{analysis.productName}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <Block icon={Target} title="타깃 고객" text={analysis.targetCustomer} />
          <Block icon={Megaphone} title="마케팅 카피" text={analysis.marketingCopy} />
          {analysis.seoKeywords && analysis.seoKeywords.length > 0 && (
            <div>
              <BlockTitle icon={Tag} title="SEO 키워드" />
              <div className="flex flex-wrap gap-1.5">
                {analysis.seoKeywords.map((k, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{k}</span>
                ))}
              </div>
            </div>
          )}
          {analysis.hashtags && analysis.hashtags.length > 0 && (
            <div>
              <BlockTitle icon={Hash} title="해시태그" />
              <div className="flex flex-wrap gap-1.5">
                {analysis.hashtags.map((k, i) => (
                  <span key={i} className="text-xs bg-brand-muted text-brand px-2 py-1 rounded">{k}</span>
                ))}
              </div>
            </div>
          )}
          <Block icon={Sparkles} title="시즌 캠페인" text={analysis.seasonalCampaign} />
          <Block icon={TrendingUp} title="가격 포지셔닝" text={analysis.pricePositioning} />
          <Block icon={Award} title="차별점" text={analysis.differentiation} />
          {analysis.recommendedChannels && analysis.recommendedChannels.length > 0 && (
            <div>
              <BlockTitle icon={Store} title="추천 판매 채널" />
              <div className="space-y-2">
                {analysis.recommendedChannels.map((c, i) => (
                  <div key={i} className="border border-gray-100 rounded-lg p-3">
                    <p className="text-sm font-semibold text-gray-900">
                      {c.channel} <span className="text-xs text-gray-400">({c.priority})</span>
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">{c.reasoning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-between">
          <button
            onClick={onDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg disabled:opacity-60"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            삭제
          </button>
          <button
            onClick={onClose}
            className="text-sm text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

function BlockTitle({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 mb-2">
      <Icon className="w-4 h-4 text-brand" />
      {title}
    </div>
  );
}

function Block({
  icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string | null;
}) {
  if (!text) return null;
  return (
    <div>
      <BlockTitle icon={icon} title={title} />
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{text}</p>
    </div>
  );
}
