"use client";

import type { VoteRecord } from "@/lib/types";
import type { VariantState } from "@/lib/experiment";

function fmtMs(ms: number) {
  return `${Math.round(ms / 1000)} с`;
}

function RevealCard({
  label,
  isWinner,
  variant,
}: {
  label: string;
  isWinner: boolean;
  variant: VariantState;
}) {
  return (
    <div
      className={`flex flex-col gap-1.5 rounded-xl border p-4 ${
        isWinner
          ? "border-green-500 bg-green-50 dark:bg-green-950/30"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {isWinner && <span className="text-xs font-semibold text-green-700 dark:text-green-400">Победитель</span>}
      </div>
      <span className="text-lg font-semibold">{variant.model}</span>
      <span className="text-sm text-zinc-600 dark:text-zinc-400">
        {variant.priceRub ?? "—"} ₽ ·{" "}
        {variant.startedAt && variant.completedAt
          ? fmtMs(variant.completedAt - variant.startedAt)
          : "—"}
      </span>
      <span className="text-xs text-zinc-500">generation_id: {variant.generationId ?? "—"}</span>
      {variant.resultUrl && (
        <a
          href={variant.resultUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium underline underline-offset-2"
        >
          Открыть результат
        </a>
      )}
    </div>
  );
}

export default function RevealStep({
  variantA,
  variantB,
  vote,
  onRestart,
}: {
  variantA: VariantState;
  variantB: VariantState;
  vote: VoteRecord;
  onRestart: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold">Результаты раскрыты</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <RevealCard label="Вариант A" isWinner={vote.winner === "a"} variant={variantA} />
        <RevealCard label="Вариант B" isWinner={vote.winner === "b"} variant={variantB} />
      </div>
      {vote.winner === "tie" && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Вы выбрали: ничья.</p>
      )}
      {vote.reason && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Причина выбора: {vote.reason}</p>
      )}
      <button
        className="self-start rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-zinc-700 dark:hover:bg-white/[.06]"
        onClick={onRestart}
      >
        Новое сравнение
      </button>
    </div>
  );
}
