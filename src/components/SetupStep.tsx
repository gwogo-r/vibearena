"use client";

import { CATEGORIES, type CategoryId, type ImageModel } from "@/lib/types";
import { commonAspectRatios } from "@/lib/compat";
import { PROMPT_MAX_LEN } from "@/lib/schemas";
import ModelCatalogTable from "./ModelCatalogTable";

type Props = {
  models: ImageModel[];
  category: CategoryId;
  onCategoryChange: (c: CategoryId) => void;
  prompt: string;
  onPromptChange: (p: string) => void;
  modelAId: string;
  modelBId: string;
  onModelAChange: (id: string) => void;
  onModelBChange: (id: string) => void;
  aspectRatio: string;
  onAspectRatioChange: (v: string) => void;
  productImageUrl: string | null;
  productImageName: string | null;
  productImageUploading: boolean;
  productImageError: string | null;
  onProductImageChange: (file: File) => void;
  onProductImageRemove: () => void;
  loading: boolean;
  error: string | null;
  onSubmit: () => void;
};

export default function SetupStep({
  models,
  category,
  onCategoryChange,
  prompt,
  onPromptChange,
  modelAId,
  modelBId,
  onModelAChange,
  onModelBChange,
  aspectRatio,
  onAspectRatioChange,
  productImageUrl,
  productImageName,
  productImageUploading,
  productImageError,
  onProductImageChange,
  onProductImageRemove,
  loading,
  error,
  onSubmit,
}: Props) {
  const modelA = models.find((m) => m.id === modelAId);
  const modelB = models.find((m) => m.id === modelBId);
  const ratios = modelA && modelB ? commonAspectRatios(modelA, modelB) : [];
  const canSubmit = Boolean(
    prompt.trim() && modelAId && modelBId && modelAId !== modelBId && !loading && !productImageUploading
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">VibeArena</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Сравните две модели на своей задаче — вслепую, с учётом цены и скорости.
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Категория задачи</span>
        <select
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value as CategoryId)}
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Промпт</span>
        <textarea
          className="min-h-24 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          value={prompt}
          maxLength={PROMPT_MAX_LEN}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Опишите, что нужно сгенерировать…"
        />
        <span className="self-end text-xs text-zinc-500">
          {prompt.length}/{PROMPT_MAX_LEN}
        </span>
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Фото товара (необязательно)</span>
        {productImageUrl ? (
          <div className="flex items-center gap-3 rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={productImageUrl} alt="Загруженное фото товара" className="h-16 w-16 rounded object-cover" />
            <div className="flex flex-1 flex-col">
              <span className="text-sm">{productImageName ?? "Фото загружено"}</span>
              <span className="text-xs text-zinc-500">
                Сравниваем только модели с поддержкой image-editing — товар останется как на фото.
              </span>
            </div>
            <button
              type="button"
              className="text-xs font-medium text-red-600 underline underline-offset-2 dark:text-red-400"
              onClick={onProductImageRemove}
            >
              Убрать
            </button>
          </div>
        ) : (
          <>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={productImageUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onProductImageChange(file);
                e.target.value = "";
              }}
              className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-zinc-200 dark:file:bg-zinc-800 dark:hover:file:bg-zinc-700"
            />
            <span className="text-xs text-zinc-500">
              Без фото — обычное сравнение text-to-image. С фото — сравниваем image-editing модели: товар
              останется как на фото, меняется только сцена вокруг него.
            </span>
          </>
        )}
        {productImageUploading && <p className="text-sm text-zinc-500">Загружаем фото…</p>}
        {productImageError && <p className="text-sm text-red-600 dark:text-red-400">{productImageError}</p>}
      </div>

      <ModelCatalogTable models={models} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Модель A</span>
          <select
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            value={modelAId}
            onChange={(e) => onModelAChange(e.target.value)}
          >
            <option value="">Выбрать модель…</option>
            {models.map((m) => (
              <option key={m.id} value={m.id} disabled={m.id === modelBId}>
                {m.title ?? m.id}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Модель B</span>
          <select
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            value={modelBId}
            onChange={(e) => onModelBChange(e.target.value)}
          >
            <option value="">Выбрать модель…</option>
            {models.map((m) => (
              <option key={m.id} value={m.id} disabled={m.id === modelAId}>
                {m.title ?? m.id}
              </option>
            ))}
          </select>
        </label>
      </div>

      {modelA && modelB && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Общий формат (aspect ratio)</span>
          {ratios.length > 0 ? (
            <select
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              value={aspectRatio}
              onChange={(e) => onAspectRatioChange(e.target.value)}
            >
              {ratios.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              У выбранных моделей нет общего формата — каждая будет использовать формат по умолчанию.
            </p>
          )}
        </label>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        className="self-start rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-[#ccc]"
        disabled={!canSubmit}
        onClick={onSubmit}
      >
        {loading ? "Считаем стоимость…" : "Рассчитать стоимость"}
      </button>
    </div>
  );
}
