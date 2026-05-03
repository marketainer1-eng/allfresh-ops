"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Plus } from "lucide-react";

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

const EMOJI_PRESETS = ["🍓", "🍇", "🥭", "🍉", "🍊", "🍑", "🍋", "🍈", "🫐", "🍒", "🍍", "🥝"];

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

export default function FruitNewPage() {
  const router = useRouter();
  const [form, setForm] = useState<FruitForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!form.name.trim()) {
      setError("과일명을 입력해주세요.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/fruits", {
        method: "POST",
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
        throw new Error(err.message ?? "등록에 실패했습니다.");
      }
      const created = await res.json();
      router.push(`/app/fruits/${created.id}`);
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/app/fruits"
          className="text-gray-400 hover:text-brand transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">새 과일 등록</h1>
          <p className="text-sm text-gray-500 mt-0.5">과일 포트폴리오에 새 품목을 추가합니다.</p>
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

          {/* 이모지 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">이모지 선택</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {EMOJI_PRESETS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setForm({ ...form, emoji: em })}
                  className={`w-10 h-10 text-xl rounded-lg border-2 transition-colors ${
                    form.emoji === em
                      ? "border-brand bg-brand-muted"
                      : "border-gray-100 hover:border-gray-300"
                  }`}
                >
                  {em}
                </button>
              ))}
              <input
                type="text"
                value={form.emoji}
                onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                className="w-10 h-10 text-xl text-center border-2 border-gray-200 rounded-lg focus:outline-none focus:border-brand"
                maxLength={2}
                placeholder="✏️"
              />
            </div>
            <p className="text-xs text-gray-400">직접 이모지를 입력하거나 위에서 선택하세요</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                과일명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="예: 딸기"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">품종</label>
              <input
                type="text"
                value={form.variety}
                onChange={(e) => setForm({ ...form, variety: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="예: 설향, 샤인머스캣"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">카테고리</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="예: 베리류, 포도류, 열대과일"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">설명</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none"
              placeholder="과일 특성, 주요 특징, 운영 전략 등을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">우선순위</label>
            <div className="flex gap-3">
              {[
                { value: 1, label: "낮음", desc: "보조 품목", color: "border-gray-300 text-gray-600" },
                { value: 2, label: "중간", desc: "일반 품목", color: "border-blue-400 text-blue-700" },
                { value: 3, label: "높음", desc: "주력 품목", color: "border-brand text-brand" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, priorityLevel: opt.value })}
                  className={`flex-1 py-3 rounded-lg border-2 transition-colors ${
                    form.priorityLevel === opt.value
                      ? `${opt.color} bg-opacity-10`
                      : "border-gray-100 text-gray-400 hover:border-gray-200"
                  }`}
                >
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs opacity-70">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 시즌 정보 */}
        <section className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-gray-900 text-base">시즌 일정</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              연도를 넘기는 경우(예: 12월~3월)도 올바르게 처리됩니다.
            </p>
          </div>

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

          {/* 미리보기 바 */}
          <div>
            <p className="text-xs text-gray-400 mb-2">시즌 프리뷰 (1월~12월)</p>
            <div className="h-3 bg-gray-100 rounded-full relative overflow-hidden">
              {(() => {
                const s = form.seasonStartMonth;
                const e = form.seasonEndMonth;
                const sLeft = ((s - 1) / 12) * 100;
                const sWidth = s <= e ? ((e - s + 1) / 12) * 100 : 100;
                return (
                  <div
                    className="absolute h-full bg-green-200 rounded-full"
                    style={{ left: `${sLeft}%`, width: `${Math.min(sWidth, 100 - sLeft)}%` }}
                  />
                );
              })()}
              {(() => {
                const ps = form.peakStartMonth;
                const pe = form.peakEndMonth;
                const pLeft = ((ps - 1) / 12) * 100;
                const pWidth = ps <= pe ? ((pe - ps + 1) / 12) * 100 : 50;
                return (
                  <div
                    className="absolute h-full bg-green-500 rounded-full"
                    style={{ left: `${pLeft}%`, width: `${Math.min(pWidth, 100 - pLeft)}%` }}
                  />
                );
              })()}
            </div>
            <div className="flex justify-between text-xs text-gray-300 mt-1">
              {["1","2","3","4","5","6","7","8","9","10","11","12"].map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
        </section>

        {/* 리드타임 */}
        <section className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-gray-900 text-base">리드타임 설정</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              캠페인 생성 시 소싱·마케팅 시작일을 자동으로 계산하는 기준입니다.
            </p>
          </div>

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
              <p className="text-xs text-gray-400 mt-1">제철 {form.sourcingLeadDays}일 전 소싱 시작 권장</p>
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
          <p className="text-xs text-gray-400">
            선택된 채널: {form.defaultChannels.length > 0
              ? form.defaultChannels.map((c) => CHANNEL_OPTIONS.find((o) => o.value === c)?.label).join(", ")
              : "없음"}
          </p>
        </section>

        {/* 저장 */}
        <div className="flex justify-end gap-3 pb-6">
          <Link
            href="/app/fruits"
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
              <Plus className="w-4 h-4" />
            )}
            {saving ? "등록 중..." : "과일 등록"}
          </button>
        </div>
      </form>
    </div>
  );
}
