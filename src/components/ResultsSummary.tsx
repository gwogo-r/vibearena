"use client";

import { useEffect, useState } from "react";
import { getVotes, summarizeByCategory, summarizeVotes, type CategorySummary, type ResultsSummary } from "@/lib/votes";

function CategoryTable({ summary }: { summary: CategorySummary }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{summary.categoryLabel}</span>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
              <th className="px-3 py-2 font-medium">Модель</th>
              <th className="px-3 py-2 font-medium">Победы</th>
              <th className="px-3 py-2 font-medium">Сравнений</th>
              <th className="px-3 py-2 font-medium">Win rate</th>
              <th className="px-3 py-2 font-medium">Ничьи</th>
              <th className="px-3 py-2 font-medium">Средняя цена</th>
              <th className="px-3 py-2 font-medium">Среднее время</th>
              <th className="px-3 py-2 font-medium">Рекомендация</th>
            </tr>
          </thead>
          <tbody>
            {summary.models.map((m) => (
              <tr key={m.model} className="border-b border-zinc-100 last:border-0 dark:border-zinc-900">
                <td className="px-3 py-1.5">{m.model}</td>
                <td className="px-3 py-1.5">{m.wins}</td>
                <td className="px-3 py-1.5">{m.comparisons}</td>
                <td className="px-3 py-1.5">{m.winRate}%</td>
                <td className="px-3 py-1.5">{m.ties}</td>
                <td className="px-3 py-1.5">{m.avgPriceRub} ₽</td>
                <td className="px-3 py-1.5">{Math.round(m.avgLatencyMs / 1000)} с</td>
                <td
                  className={`px-3 py-1.5 font-medium ${
                    m.recommendation === "Основная модель"
                      ? "text-green-700 dark:text-green-400"
                      : m.recommendation === "Недостаточно данных"
                        ? "text-zinc-500"
                        : "text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {m.recommendation}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ResultsSummarySection({ refreshKey }: { refreshKey: number }) {
  const [summary, setSummary] = useState<ResultsSummary | null>(null);
  const [byCategory, setByCategory] = useState<CategorySummary[]>([]);

  useEffect(() => {
    // Чтение из localStorage — источник вне React, поэтому setState здесь оправдан
    // (без этого будет расхождение SSR/клиент: на сервере localStorage недоступен).
    const votes = getVotes();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSummary(summarizeVotes(votes));
    setByCategory(summarizeByCategory(votes));
  }, [refreshKey]);

  if (!summary || summary.totalComparisons === 0) return null;

  return (
    <section className="mt-10 flex flex-col gap-6 border-t border-zinc-200 pt-8 dark:border-zinc-800">
      <div>
        <h2 className="text-lg font-semibold">Результаты экспериментов</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Рекомендации формируются по локальным результатам слепых сравнений. Для надёжного выбора
          проведите минимум 3 сравнения модели в каждой категории.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div>
          <div className="text-2xl font-semibold">{summary.totalComparisons}</div>
          <div className="text-zinc-500">сравнений</div>
        </div>
        <div>
          <div className="text-2xl font-semibold">{summary.ties}</div>
          <div className="text-zinc-500">ничьих</div>
        </div>
        <div>
          <div className="text-2xl font-semibold">{summary.avgPriceRub} ₽</div>
          <div className="text-zinc-500">средняя цена</div>
        </div>
        <div>
          <div className="text-2xl font-semibold">{Math.round(summary.avgLatencyMs / 1000)} с</div>
          <div className="text-zinc-500">среднее время</div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {byCategory.map((cat) => (
          <CategoryTable key={cat.category} summary={cat} />
        ))}
      </div>
    </section>
  );
}
