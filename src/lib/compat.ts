// Подбор совместимых параметров для пары моделей на основе /capabilities.
// Чистые функции — без побочных эффектов, легко тестировать.

import type { EstimateRequest, ImageModel } from "./types";

export function getImageModels(models: ImageModel[]): ImageModel[] {
  return models.filter((m) => m.type === "image");
}

export function supportsParam(model: ImageModel, param: string): boolean {
  return Boolean(model.params?.[param]);
}

/** Общие значения aspect_ratio, поддерживаемые обеими моделями. Пусто, если пересечения нет. */
export function commonAspectRatios(a: ImageModel, b: ImageModel): string[] {
  const optionsA = a.params?.aspect_ratio?.enum ?? [];
  const optionsB = b.params?.aspect_ratio?.enum ?? [];
  return optionsA.filter((v) => optionsB.includes(v));
}

/** Seed можно использовать одинаковым для обеих моделей только если обе его поддерживают. */
export function canShareSeed(a: ImageModel, b: ImageModel): boolean {
  return supportsParam(a, "seed") && supportsParam(b, "seed");
}

/**
 * Список для выбора зависит от того, загружено ли фото товара:
 * без фото — обычный text-to-image (модели, которым фото не обязательно);
 * с фото — только модели, умеющие принять image_input.
 */
export function filterModelsForMode(models: ImageModel[], hasPhoto: boolean): ImageModel[] {
  return hasPhoto ? models.filter((m) => m.supportsImageInput) : models.filter((m) => !m.requiresImageInput);
}

/** Пара по умолчанию для первого запуска — две самые дешёвые модели, чтобы не смотреть на пустые селекты. */
export function pickDefaultPair(models: ImageModel[]): [string, string] | null {
  if (models.length < 2) return null;
  const sorted = [...models].sort((a, b) => (a.price_rub ?? Infinity) - (b.price_rub ?? Infinity));
  return [sorted[0].id, sorted[1].id];
}

const PRODUCT_PRESERVE_INSTRUCTION =
  "Keep this exact product pixel-identical, do not redesign it.";

/** С фото товара промпт всегда просит сохранить товар как есть и только сменить сцену вокруг него. */
export function buildPhotoPrompt(userPrompt: string): string {
  return `${PRODUCT_PRESERVE_INSTRUCTION} ${userPrompt}`.trim();
}

export function buildEstimateParams(
  model: string,
  prompt: string,
  aspectRatio: string | undefined,
  seed: number | undefined,
  imageInput?: string[]
): EstimateRequest {
  return {
    type: "image",
    model,
    prompt,
    strict: true,
    ...(aspectRatio ? { aspect_ratio: aspectRatio } : {}),
    ...(seed !== undefined ? { seed } : {}),
    ...(imageInput?.length ? { image_input: imageInput } : {}),
  };
}
