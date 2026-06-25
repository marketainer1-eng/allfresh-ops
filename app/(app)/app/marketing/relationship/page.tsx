"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Upload,
  Loader2,
  ArrowLeft,
  CalendarClock,
  HeartHandshake,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  Search,
  Repeat,
  Star,
} from "lucide-react";
import {
  computeRelationship,
  type RelationshipResult,
  type OrderRow,
  type SegmentSummary,
} from "@/lib/marketing/relationshipPredict";

const TONE: Record<SegmentSummary["tone"], { bg: string; border: string; text: string; dot: string }> = {
  good: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", dot: "bg-emerald-500" },
  warn: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", dot: "bg-amber-500" },
  info: { bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-800", dot: "bg-sky-500" },
  neutral: { bg: "bg-stone-50", border: "border-stone-200", text: "text-slate-700", dot: "bg-slate-400" },
};

async function parseFile(file: File): Promise<OrderRow[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || name.endsWith(".txt")) {
    const text = await file.text();
    const Papa = (await import("papaparse")).default;
    const parsed = Papa.parse<OrderRow>(text, {
      header: true,
      skipEmptyLines: true,
    });
    return (parsed.data ?? []).filter((r) => r && typeof r === "object");
  }
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  // 시트 중 행이 가장 많은(=주문 상세) 시트 선택
  let best: OrderRow[] = [];
  for (const sn of wb.SheetNames) {
    const ws = wb.Sheets[sn];
    const rows = XLSX.utils.sheet_to_json<OrderRow>(ws, { defval: null });
    if (rows.length > best.length) best = rows;
  }
  return best;
}

export default function RelationshipPage() {
  const [result, setResult] = useState<RelationshipResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [segFilter, setSegFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setFileName(file.name);
    try {
      const rows = await parseFile(file);
      if (!rows.length) throw new Error("데이터 행을 찾지 못했습니다. 주문 내역 시트를 확인해 주세요.");
      const res = computeRelationship(rows, new Date());
      if (res.totalCustomers === 0) {
        throw new Error("고객을 식별하지 못했습니다. 주문자/전화번호 컬럼이 있는지 확인해 주세요.");
      }
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "파일 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!result) return [];
    const q = query.trim();
    return result.topCustomers.filter((c) => {
      if (segFilter !== "all" && c.segment !== segFilter) return false;
      if (q && !c.nameMasked.includes(q) && !c.phoneMasked.includes(q)) return false;
      return true;
    });
  }, [result, segFilter, query]);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <Link
        href="/app/marketing/insights"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 mb-3"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> 고객 인사이트
      </Link>

      <div className="flex items-start gap-3 mb-5">
        <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
          <HeartHandshake className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            고객 관계 예측
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            주문 데이터로 <b>누가 · 언제 · 또 살까</b>를 예측합니다. RFM·명절 재구매 패턴 기반의
            설명 가능한 분석입니다.
          </p>
        </div>
      </div>

      {/* 업로드 */}
      {!result && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="w-full border-2 border-dashed border-stone-300 hover:border-purple-400 rounded-xl p-10 text-center transition-colors group disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-7 h-7 mx-auto text-purple-500 animate-spin mb-3" />
            ) : (
              <Upload className="w-7 h-7 mx-auto text-stone-400 group-hover:text-purple-500 mb-3" />
            )}
            <div className="text-sm font-semibold text-slate-800">
              {loading ? `${fileName} 분석 중...` : "주문 데이터 업로드 (xlsx / csv)"}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              주문자·전화번호·주문날짜·제품명·판매가·쇼핑몰 컬럼을 자동 인식합니다
            </div>
          </button>
          <div className="mt-3 flex items-start gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-2.5">
            <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              업로드한 데이터는 <b>브라우저에서만 처리</b>되며 서버로 전송·저장되지 않습니다. 고객
              개인정보는 화면에서 마스킹되어 표시됩니다.
            </span>
          </div>
          {error && (
            <div className="mt-3 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="space-y-5">
          {/* 요약 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat icon={Users} color="text-purple-600" bg="bg-purple-100" label="구매자" value={result.totalCustomers.toLocaleString()} unit="명" />
            <Stat icon={Repeat} color="text-emerald-600" bg="bg-emerald-100" label="재구매율" value={(result.repeatRate * 100).toFixed(1)} unit="%" />
            <Stat icon={Star} color="text-amber-600" bg="bg-amber-100" label="1회 구매" value={(result.oneTimeRate * 100).toFixed(1)} unit="%" />
            <Stat icon={CalendarClock} color="text-sky-600" bg="bg-sky-100" label="주문" value={result.totalOrders.toLocaleString()} unit="건" />
          </div>
          <div className="text-xs text-slate-500">
            기간 {result.periodStart ?? "?"} ~ {result.periodEnd ?? "?"} ·{" "}
            {result.channelMix.map((c) => `${c.name} ${c.count.toLocaleString()}`).join(" · ")} ·{" "}
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setError(null);
              }}
              className="text-purple-600 hover:underline font-medium"
            >
              다른 파일 업로드
            </button>
          </div>

          {/* 언제 — 다음 구매 캘린더 */}
          <Section icon={CalendarClock} title="언제 — 다음 구매 시점 (명절 주기)">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {result.nextPurchase.map((np) => (
                <div
                  key={np.season}
                  className="rounded-xl border border-stone-200 bg-gradient-to-br from-white to-stone-50 p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs text-slate-500">다음 {np.season}</div>
                    <div className="text-lg font-bold text-slate-900">{np.dateLabel}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">D-30 발송 권장</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-700">
                      {np.count.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-500">재구매 유력(명)</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* 누가 — 관계 세그먼트 */}
          <Section icon={Users} title="누가 — 관계 세그먼트">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {result.segments.map((s) => {
                const t = TONE[s.tone];
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSegFilter(segFilter === s.key ? "all" : s.key)}
                    className={`text-left rounded-xl border ${t.border} ${t.bg} p-3.5 transition-all ${
                      segFilter === s.key ? "ring-2 ring-offset-1 ring-purple-300" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-bold ${t.text} flex items-center gap-1.5`}>
                        <span className={`w-2 h-2 rounded-full ${t.dot}`} />
                        {s.label}
                      </span>
                      <span className={`text-xs font-bold ${t.text}`}>
                        {s.count.toLocaleString()}
                        <span className="font-normal text-slate-400 ml-1">
                          ({(s.share * 100).toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{s.desc}</p>
                    <p className="text-[11px] text-slate-800 mt-1.5 leading-relaxed">
                      <b>액션:</b> {s.action}
                    </p>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* 또 살까 — 점수 + 구매횟수 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Section icon={TrendingUp} title="또 살까 — 재구매 가능성 점수">
              <BarList
                items={result.scoreTiers.map((t) => ({
                  label: t.label,
                  count: t.count,
                  color:
                    t.tone === "good" ? "bg-emerald-500" : t.tone === "info" ? "bg-sky-500" : "bg-slate-300",
                }))}
                total={result.totalCustomers}
              />
              <p className="text-[11px] text-slate-400 mt-2">
                빈도(최대 60) + 최근성(최대 25) + 명절 충성(15)의 설명 가능한 점수
              </p>
            </Section>
            <Section icon={Repeat} title="구매 횟수 분포">
              <BarList
                items={result.freqDist.map((f, i) => ({
                  label: f.label,
                  count: f.count,
                  color: i === 0 ? "bg-amber-400" : "bg-purple-500",
                }))}
                total={result.totalCustomers}
              />
            </Section>
          </div>

          {/* 고객 표 */}
          <Section icon={Users} title={`핵심 고객 (점수순 상위 ${result.topCustomers.length})`}>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="이름·전화 검색(마스킹값)"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-200 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                />
              </div>
              <select
                value={segFilter}
                onChange={(e) => setSegFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-stone-200 text-sm bg-white outline-none focus:border-purple-400"
              >
                <option value="all">전체 세그먼트</option>
                {result.segments.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs min-w-[720px]">
                <thead>
                  <tr className="text-slate-400 border-b border-stone-200 text-left">
                    <th className="py-2 px-2 font-semibold">고객</th>
                    <th className="py-2 px-2 font-semibold">전화</th>
                    <th className="py-2 px-2 font-semibold text-right">구매</th>
                    <th className="py-2 px-2 font-semibold">최근구매</th>
                    <th className="py-2 px-2 font-semibold text-right">누적금액</th>
                    <th className="py-2 px-2 font-semibold">주력명절</th>
                    <th className="py-2 px-2 font-semibold">세그먼트</th>
                    <th className="py-2 px-2 font-semibold text-right">점수</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.slice(0, 100).map((c, i) => (
                    <tr key={i} className="border-b border-stone-100 hover:bg-stone-50">
                      <td className="py-2 px-2 font-semibold text-slate-800">{c.nameMasked}</td>
                      <td className="py-2 px-2 text-slate-500">{c.phoneMasked}</td>
                      <td className="py-2 px-2 text-right text-slate-700">{c.orders}회</td>
                      <td className="py-2 px-2 text-slate-500">
                        {c.lastDate}
                        <span className="text-slate-300"> ({c.recencyDays}일 전)</span>
                      </td>
                      <td className="py-2 px-2 text-right font-semibold text-slate-800">
                        {c.total.toLocaleString()}원
                      </td>
                      <td className="py-2 px-2 text-slate-600">{c.dominantSeason ?? "-"}</td>
                      <td className="py-2 px-2 text-slate-600">{c.segment}</td>
                      <td className="py-2 px-2 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md font-bold ${
                            c.score >= 80
                              ? "bg-emerald-100 text-emerald-700"
                              : c.score >= 60
                                ? "bg-sky-100 text-sky-700"
                                : c.score >= 40
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-stone-100 text-slate-500"
                          }`}
                          title={c.reasons.join(" · ")}
                        >
                          {c.score}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredCustomers.length === 0 && (
                <div className="text-center text-sm text-slate-400 py-6">
                  조건에 맞는 고객이 없습니다.
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              점수에 마우스를 올리면 산출 근거가 표시됩니다. 개인정보는 마스킹되어 있습니다.
            </p>
          </Section>

          {/* 데이터 한계 */}
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> 데이터 한계
            </div>
            <ul className="space-y-1 text-[11px] text-slate-600 leading-relaxed list-disc list-inside">
              {result.dataLimits.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  color,
  bg,
  label,
  value,
  unit,
}: {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-bold text-slate-900">
        {value}
        <span className="text-xs font-normal text-slate-400 ml-0.5">{unit}</span>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-4 md:p-5 shadow-sm">
      <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
        <Icon className="w-4 h-4 text-purple-600" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function BarList({
  items,
  total,
}: {
  items: { label: string; count: number; color: string }[];
  total: number;
}) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div key={it.label}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-600">{it.label}</span>
            <span className="text-slate-500 font-medium">
              {it.count.toLocaleString()}
              {total > 0 && (
                <span className="text-slate-300 ml-1">({((it.count / total) * 100).toFixed(1)}%)</span>
              )}
            </span>
          </div>
          <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${it.color}`}
              style={{ width: `${(it.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
