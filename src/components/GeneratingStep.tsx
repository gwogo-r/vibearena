"use client";

import type { VariantState } from "@/lib/experiment";

const STATUS_LABEL: Record<VariantState["displayStatus"], string> = {
  idle: "Ожидает",
  processing: "Генерируется…",
  complete: "Завершено",
  error: "Ошибка",
};

function VariantCard({ label, variant }: { label: string; variant: VariantState }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            variant.displayStatus === "complete"
              ? "bg-green-500"
              : variant.displayStatus === "error"
                ? "bg-red-500"
                : "bg-amber-500 animate-pulse"
          }`}
        />
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {STATUS_LABEL[variant.displayStatus]}
        </span>
      </div>
      {variant.errorMessage && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {variant.errorMessage}
          {variant.requestId && (
            <span className="block text-xs text-zinc-500">ID запроса: {variant.requestId}</span>
          )}
        </p>
      )}
      {variant.refunded && (
        <p className="text-xs text-zinc-500">Средства за этот вариант возвращены на баланс.</p>
      )}
    </div>
  );
}

export default function GeneratingStep({
  modelALabel,
  modelBLabel,
  variantA,
  variantB,
}: {
  modelALabel: string;
  modelBLabel: string;
  variantA: VariantState;
  variantB: VariantState;
}) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold">Генерация</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Опрашиваем статус каждые 10–15 секунд. Обычно это занимает от 30 секунд до пары минут.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <VariantCard label={modelALabel} variant={variantA} />
        <VariantCard label={modelBLabel} variant={variantB} />
      </div>
    </div>
  );
}
