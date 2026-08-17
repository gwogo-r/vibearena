"use client";

import type { ImageModel } from "@/lib/types";
import { supportsParam } from "@/lib/compat";

export default function ModelCatalogTable({ models }: { models: ImageModel[] }) {
  if (models.length === 0) return null;

  const sorted = [...models].sort((a, b) => (a.price_rub ?? Infinity) - (b.price_rub ?? Infinity));

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">Каталог моделей ({sorted.length})</span>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
              <th className="px-3 py-2 font-medium">Модель</th>
              <th className="px-3 py-2 font-medium">Цена</th>
              <th className="px-3 py-2 font-medium">Форматы</th>
              <th className="px-3 py-2 font-medium">Seed</th>
              <th className="px-3 py-2 font-medium">Качество</th>
              <th className="px-3 py-2 font-medium">Фото</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((m) => (
              <tr key={m.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-900">
                <td className="px-3 py-1.5">{m.title ?? m.id}</td>
                <td className="px-3 py-1.5">{m.price_rub !== undefined ? `${m.price_rub} ₽` : "—"}</td>
                <td className="px-3 py-1.5 text-zinc-500">
                  {m.params?.aspect_ratio?.enum?.join(", ") ?? "—"}
                </td>
                <td className="px-3 py-1.5 text-zinc-500">{supportsParam(m, "seed") ? "да" : "—"}</td>
                <td className="px-3 py-1.5 text-zinc-500">{supportsParam(m, "quality") ? "да" : "—"}</td>
                <td className="px-3 py-1.5 text-zinc-500">{m.requiresImageInput ? "нужно" : m.supportsImageInput ? "можно" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-500">
        Цены и параметры — из актуального каталога VibeMarketolog. «Качество» — модель принимает параметр
        basic/high (поддерживают немногие). «Фото» — «нужно» значит модели обязателен референс товара,
        «можно» — работает и с фото, и без. Если не знаете, что выбрать, внизу уже стоит пара самых
        дешёвых моделей — можно просто её оставить.
      </p>
    </div>
  );
}
