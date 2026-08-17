"use client";

import type { EstimateResponse } from "@/lib/types";

type Props = {
  modelALabel: string;
  modelBLabel: string;
  estimateA: EstimateResponse;
  estimateB: EstimateResponse;
  seedWarning: string | null;
  loading: boolean;
  onConfirm: () => void;
  onBack: () => void;
};

function EstimateCard({ label, estimate }: { label: string; estimate: EstimateResponse }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-2xl font-semibold">{estimate.price_rub ?? "—"} ₽</span>
      {estimate.warnings && estimate.warnings.length > 0 && (
        <ul className="mt-1 list-disc pl-4 text-xs text-amber-600 dark:text-amber-400">
          {estimate.warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}
      {estimate.param_rejections && estimate.param_rejections.length > 0 && (
        <ul className="mt-1 list-disc pl-4 text-xs text-red-600 dark:text-red-400">
          {estimate.param_rejections.map((r, i) => (
            <li key={i}>{r.hint ?? `${r.field}: значение не поддерживается`}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function EstimateStep({
  modelALabel,
  modelBLabel,
  estimateA,
  estimateB,
  seedWarning,
  loading,
  onConfirm,
  onBack,
}: Props) {
  const total = (estimateA.price_rub ?? 0) + (estimateB.price_rub ?? 0);
  const afterBalance = estimateB.balance_after ?? estimateA.balance_after;
  const bothValid = estimateA.valid && estimateB.valid;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold">Предварительная смета</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <EstimateCard label={modelALabel} estimate={estimateA} />
        <EstimateCard label={modelBLabel} estimate={estimateB} />
      </div>

      <div className="flex flex-col gap-1 rounded-xl bg-zinc-100 p-4 text-sm dark:bg-zinc-900">
        <div className="flex justify-between">
          <span>Общая стоимость</span>
          <span className="font-semibold">{total} ₽</span>
        </div>
        {afterBalance !== undefined && (
          <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
            <span>Остаток после генерации (оценка)</span>
            <span>{afterBalance} ₽</span>
          </div>
        )}
      </div>

      {seedWarning && (
        <p className="text-sm text-amber-600 dark:text-amber-400">{seedWarning}</p>
      )}

      {!bothValid && (
        <p className="text-sm text-red-600 dark:text-red-400">
          Одна из моделей не приняла параметры — вернитесь и измените промпт или формат.
        </p>
      )}

      <div className="flex gap-3">
        <button
          className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-zinc-700 dark:hover:bg-white/[.06]"
          onClick={onBack}
        >
          Назад
        </button>
        <button
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-[#ccc]"
          disabled={!bothValid || loading}
          onClick={onConfirm}
        >
          {loading ? "Запускаем…" : "Подтвердить и запустить"}
        </button>
      </div>
    </div>
  );
}
