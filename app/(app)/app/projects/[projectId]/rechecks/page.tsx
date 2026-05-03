"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, TrendingUp, Minus, TrendingDown, Plus, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Recheck {
  id: string;
  checkDate: string;
  result: string;
  metricBefore?: string;
  metricAfter?: string;
  note?: string;
  ticket: { title: string; priority: string };
  session: { title: string };
}

interface Ticket {
  id: string;
  title: string;
  sessionId: string;
}

const resultConfig: Record<string, { label: string; color: string; Icon: React.ComponentType<{ className?: string }> }> = {
  improved: { label: "개선됨", color: "text-green-600 bg-green-50", Icon: TrendingUp },
  unchanged: { label: "변화없음", color: "text-gray-600 bg-gray-50", Icon: Minus },
  worsened: { label: "악화됨", color: "text-red-600 bg-red-50", Icon: TrendingDown },
};

const defaultForm = {
  ticketId: "",
  sessionId: "",
  checkDate: new Date().toISOString().split("T")[0],
  result: "improved" as const,
  metricBefore: "",
  metricAfter: "",
  note: "",
};

export default function RechecksPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [rechecks, setRechecks] = useState<Recheck[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ ...defaultForm });
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    loadData();
  }, [projectId]);

  async function loadData() {
    setIsLoading(true);
    const [rRes, tRes, pRes] = await Promise.all([
      fetch(`/api/rechecks?projectId=${projectId}`),
      fetch(`/api/ticket-drafts?projectId=${projectId}`),
      fetch(`/api/projects/${projectId}`),
    ]);
    if (rRes.ok) setRechecks(await rRes.json());
    if (tRes.ok) setTickets(await tRes.json());
    if (pRes.ok) {
      const p = await pRes.json();
      setProjectName(p.name ?? "");
    }
    setIsLoading(false);
  }

  async function saveRecheck() {
    if (!form.ticketId || !form.sessionId) return;
    setIsSaving(true);
    const res = await fetch("/api/rechecks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setIsSaving(false);
    if (res.ok) {
      setForm({ ...defaultForm });
      setShowForm(false);
      loadData();
    }
  }

  const selectedTicket = tickets.find((t) => t.id === form.ticketId);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/app/projects/${projectId}`}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">효과 검증 (재점검)</h1>
          <p className="text-gray-500 text-sm mt-0.5">{projectName}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          재점검 등록
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-brand/20 p-6 space-y-4">
          <h3 className="font-medium text-gray-900">재점검 등록</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">티켓 선택 *</label>
              <select
                value={form.ticketId}
                onChange={(e) => {
                  const ticket = tickets.find((t) => t.id === e.target.value);
                  setForm((p) => ({ ...p, ticketId: e.target.value, sessionId: ticket?.sessionId ?? "" }));
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              >
                <option value="">티켓 선택</option>
                {tickets.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">점검일 *</label>
              <input
                type="date"
                value={form.checkDate}
                onChange={(e) => setForm((p) => ({ ...p, checkDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">결과 *</label>
              <select
                value={form.result}
                onChange={(e) => setForm((p) => ({ ...p, result: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              >
                <option value="improved">개선됨</option>
                <option value="unchanged">변화없음</option>
                <option value="worsened">악화됨</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">이전 지표</label>
              <input
                type="text"
                value={form.metricBefore}
                onChange={(e) => setForm((p) => ({ ...p, metricBefore: e.target.value }))}
                placeholder="예: 전환율 2.3%"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">이후 지표</label>
              <input
                type="text"
                value={form.metricAfter}
                onChange={(e) => setForm((p) => ({ ...p, metricAfter: e.target.value }))}
                placeholder="예: 전환율 3.1%"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">메모</label>
              <textarea
                value={form.note}
                onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={saveRecheck}
              disabled={isSaving || !form.ticketId}
              className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark disabled:opacity-50"
            >
              {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
              저장
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
        </div>
      ) : rechecks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">검증 기록이 없습니다</h3>
          <p className="text-gray-500 text-sm">티켓을 실행한 후 효과를 측정하여 기록하세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rechecks.map((r) => {
            const conf = resultConfig[r.result] ?? resultConfig.unchanged;
            const Icon = conf.Icon;
            return (
              <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`flex-shrink-0 p-2 rounded-lg ${conf.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{r.ticket.title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{r.session.title}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right text-xs text-gray-400">
                    <p className={`font-medium text-sm ${conf.color.split(" ")[0]}`}>{conf.label}</p>
                    <p className="mt-0.5">{formatDate(r.checkDate)}</p>
                  </div>
                </div>
                {(r.metricBefore || r.metricAfter) && (
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    {r.metricBefore && (
                      <div className="text-gray-500">
                        <span className="text-xs text-gray-400 block">이전</span>
                        <span className="font-medium">{r.metricBefore}</span>
                      </div>
                    )}
                    {r.metricBefore && r.metricAfter && <span className="text-gray-300">→</span>}
                    {r.metricAfter && (
                      <div className="text-green-700">
                        <span className="text-xs text-gray-400 block">이후</span>
                        <span className="font-medium">{r.metricAfter}</span>
                      </div>
                    )}
                  </div>
                )}
                {r.note && (
                  <p className="mt-3 text-sm text-gray-500 pt-3 border-t border-gray-50">{r.note}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
