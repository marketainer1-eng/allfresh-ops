"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

const CHANNEL_OPTIONS = [
  { value: "coupang",     label: "쿠팡" },
  { value: "marketkurly", label: "마켓컬리" },
  { value: "smartstore",  label: "스마트스토어" },
  { value: "ssg",         label: "SSG닷컴" },
  { value: "oasis",       label: "오아시스" },
  { value: "direct",      label: "자사몰" },
];

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}월`,
}));

interface FruitForm {
  name: string;
  variety: string;
  category: string;
  emoji: string;
  seasonStartMonth: number;
  seasonEndMonth: number;
  peakStartMonth: number;
  peakEndMonth: number;
  sourcingLeadDays: number;
  marketingLeadDays: number;
  defaultChannels: string[];
  priorityLevel: number;
  isActive: boolean;
  description: string;
}

const defaultForm: FruitForm = {
  name: "", variety: "", category: "", emoji: "🍓",
  seasonStartMonth: 1, seasonEndMonth: 3,
  peakStartMonth: 1, peakEndMonth: 2,
  sourcingLeadDays: 30, marketingLeadDays: 14,
  defaultChannels: [],
  priorityLevel: 2,
  isActive: true,
  description: "",
};

export default function FruitEditPage() {
  const router = useRouter();
  const params = useParams();
  const fruitId = params.fruitId as string;

  const [form, setForm] = useState<FruitForm>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fruitName, setFruitName] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/fruits/${fruitId}`);
        if (!res.ok) throw new Error("과일 데이터를 불러올 수 없습니다.");
        const data = await res.json();
        setFruitName(data.name);
        setForm({
          name: data.name ?? "",
          variety: data.variety ?? "",
          category: data.category ?? "",
          emoji: data.emoji ?? "🍓",
          seasonStartMonth: data.seasonStartMonth,
          seasonEndMonth: data.seasonEndMonth,
          peakStartMonth: data.peakStartMonth,
          peakEndMonth: data.peakEndMonth,
          sourcingLeadDays: data.sourcingLeadDays,
          marketingLeadDays: data.marketingLeadDays,
          defaultChannels: data.defaultChannels ?? [],
          priorityLevel: data.priorityLevel,
          isActive: data.isActive,
          description: data.description ?? "",
        });
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [fruitId]);

  const handleChannelToggle = (ch: string) => {
    setForm((f) => ({
      ...f,
      defaultChannels: f.defaultChannels.includes(ch)
        ? f.defaultChannels.filter((c) => c !== ch)
        : [...f.defaultChannels, ch],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/fruits/${fruitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          seasonStartMonth: Number(form.seasonStartMonth),
          seasonEndMonth: Number(form.seasonEndMonth),
          peakStartMonth: Number(form.peakStartMonth),
          peakEndMonth: Number(form.peakEndMonth),
          sourcingLeadDays: Number(form.sourcingLeadDays),
          marketingLeadDays: Number(form.marketingLeadDays),
          priorityLevel: Number(form.priorityLevel),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "저장에 실패했습니다.");
      }
      router.push(`/app/fruits/${fruitId}`);
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/app/fruits/${fruitId}`}
          className="text-gray-400 hover:text-brand transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {form.emoji} {fruitName} 편집
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">과일 기본 정보와 시즌 일정을 수정합니다.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <section className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 text-base">기본 정보</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">이모지</label>
              <input
                type="text"
                value={form.emoji}
                onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-2xl focus:outline-none focus:ring-2 focus:ring-brand"
                maxLength={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">과일명 *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="예: 딸기"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">품종</label>
              <input
                type="text"
                value={form.variety}
                onChange={(e) => setForm({ ...form, variety: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="예: 설향"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">카테고리</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="예: 베리류"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">설명</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none"
              placeholder="과일 특성, 주요 채널, 운영 전략 등"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">우선순위</label>
            <div className="flex gap-3">
              {[
                { value: 1, label: "낮음", color: "border-gray-300 text-gray-600" },
                { value: 2, label: "중간", color: "border-blue-400 text-blue-700" },
                { value: 3, label: "높음", color: "border-brand text-brand" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, priorityLevel: opt.value })}
                  className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                    form.priorityLevel === opt.value
                      ? `${opt.color} bg-opacity-10 bg-current`
                      : "border-gray-100 text-gray-400"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, isActive: !form.isActive })}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                form.isActive ? "bg-brand" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  form.isActive ? "translate-x-5" : ""
                }`}
              />
            </button>
            <span className="text-sm text-gray-700 font-medium">
              {form.isActive ? "운영 중 (활성)" : "비활성"}
            </span>
          </div>
        </section>

        {/* 시즌 정보 */}
        <section className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 text-base">시즌 일정</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">제철 시작</label>
              <select
                value={form.seasonStartMonth}
                onChange={(e) => setForm({ ...form, seasonStartMonth: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">제철 종료</label>
              <select
                value={form.seasonEndMonth}
                onChange={(e) => setForm({ ...form, seasonEndMonth: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">피크 시작</label>
              <select
                value={form.peakStartMonth}
                onChange={(e) => setForm({ ...form, peakStartMonth: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">피크 종료</label>
              <select
                value={form.peakEndMonth}
                onChange={(e) => setForm({ ...form, peakEndMonth: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* 리드타임 */}
        <section className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 text-base">리드타임 설정</h2>
          <p className="text-xs text-gray-400">제철 시작일 기준으로 소싱/마케팅 시작일을 자동 계산합니다.</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                소싱 리드타임 (일)
              </label>
              <input
                type="number"
                min={0}
                max={180}
                value={form.sourcingLeadDays}
                onChange={(e) => setForm({ ...form, sourcingLeadDays: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <p className="text-xs text-gray-400 mt-1">제철 {form.sourcingLeadDays}일 전 소싱 시작</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                마케팅 리드타임 (일)
              </label>
              <input
                type="number"
                min={0}
                max={90}
                value={form.marketingLeadDays}
                onChange={(e) => setForm({ ...form, marketingLeadDays: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <p className="text-xs text-gray-400 mt-1">런칭 {form.marketingLeadDays}일 전 마케팅 준비</p>
            </div>
          </div>
        </section>

        {/* 기본 채널 */}
        <section className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 text-base">기본 판매 채널</h2>
          <div className="flex flex-wrap gap-2">
            {CHANNEL_OPTIONS.map((ch) => {
              const selected = form.defaultChannels.includes(ch.value);
              return (
                <button
                  key={ch.value}
                  type="button"
                  onClick={() => handleChannelToggle(ch.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    selected
                      ? "border-brand bg-brand text-white"
                      : "border-gray-200 text-gray-600 hover:border-brand hover:text-brand"
                  }`}
                >
                  {ch.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* 저장 */}
        <div className="flex justify-end gap-3">
          <Link
            href={`/app/fruits/${fruitId}`}
            className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-dark transition-colors disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </form>
    </div>
  );
}
