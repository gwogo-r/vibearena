// Demo mode: включается, когда VIBE_API_TOKEN не задан.
// Честно имитирует полный сценарий на fixture-данных, без скрытых обращений к реальному API.

import type {
  Capabilities,
  EstimateRequest,
  EstimateResponse,
  GenerateResponse,
  GenerationStatus,
} from "./types";

export function isDemoMode(): boolean {
  return !process.env.VIBE_API_TOKEN;
}

export const DEMO_CAPABILITIES: Capabilities = {
  image_models: [
    {
      id: "demo-fast-basic",
      title: "Demo Fast Basic",
      provider: "Demo Labs",
      type: "image",
      price_rub: 5,
      params: {
        aspect_ratio: { type: "enum", enum: ["1:1", "16:9", "9:16"] },
        seed: { type: "number", min: 0, max: 2147483647 },
      },
      // Может работать и без фото, и как image-to-image со ссылкой на референс.
      supportsImageInput: true,
    },
    {
      id: "demo-pro-quality",
      title: "Demo Pro Quality",
      provider: "Demo Vision",
      type: "image",
      price_rub: 12,
      params: {
        aspect_ratio: { type: "enum", enum: ["1:1", "16:9"] },
        quality: { type: "enum", enum: ["basic", "high"] },
      },
    },
    {
      id: "demo-art-illustrator",
      title: "Demo Art Illustrator",
      provider: "Demo Art",
      type: "image",
      price_rub: 8,
      params: {
        aspect_ratio: { type: "enum", enum: ["1:1", "3:2", "2:3"] },
        seed: { type: "number", min: 0, max: 2147483647 },
      },
    },
    {
      id: "demo-realistic-x",
      title: "Demo Realistic X",
      provider: "Demo Realism",
      type: "image",
      price_rub: 15,
      params: {
        aspect_ratio: { type: "enum", enum: ["1:1", "16:9", "9:16", "3:2"] },
        seed: { type: "number", min: 0, max: 2147483647 },
        negative_prompt: { type: "string" },
      },
      supportsImageInput: true,
    },
    {
      id: "demo-product-editor",
      title: "Demo Product Editor",
      provider: "Demo Edit",
      type: "image",
      price_rub: 18,
      params: {
        aspect_ratio: { type: "enum", enum: ["1:1", "16:9", "9:16"] },
      },
      // Только image-editing — без фото товара эта модель не запустится.
      supportsImageInput: true,
      requiresImageInput: true,
    },
  ],
};

function priceFor(model: string): number {
  return DEMO_CAPABILITIES.image_models.find((m) => m.id === model)?.price_rub ?? 10;
}

export function demoEstimate(body: EstimateRequest): EstimateResponse {
  const model = DEMO_CAPABILITIES.image_models.find((m) => m.id === body.model);
  if (!model) {
    return {
      valid: false,
      body_valid: false,
      price_rub: 0,
      warnings: [`Неизвестная demo-модель: ${body.model}`],
    };
  }
  const price = priceFor(body.model);
  return {
    valid: true,
    body_valid: true,
    funds_ok: true,
    price_rub: price,
    balance: { current: 1000, after: 1000 - price },
    balance_after: 1000 - price,
    daily_spend: { limit: 5000, today: 0, within_limit: true },
    warnings: [],
  };
}

// В памяти процесса — достаточно для demo mode в рамках одного запуска dev-сервера.
const demoGenerations = new Map<string, { model: string; startedAt: number; variant: "a" | "b" }>();
let demoCounter = 0;

export function demoStartGeneration(
  body: EstimateRequest,
  variant: "a" | "b"
): GenerateResponse {
  demoCounter += 1;
  const generationId = `demo-${demoCounter}-${variant}`;
  demoGenerations.set(generationId, { model: body.model, startedAt: Date.now(), variant });
  const price = priceFor(body.model);
  return {
    status: "processing",
    generation_id: generationId,
    price_rub: price,
    cost: price,
    balance_after: 1000 - price,
  };
}

const DEMO_GENERATION_DELAY_MS = 6000;

export function demoStatus(id: string): GenerationStatus {
  const entry = demoGenerations.get(id);
  if (!entry) {
    return {
      status: "error",
      generation_id: id,
      error_message: "Demo-генерация не найдена — возможно, сервер был перезапущен",
    };
  }
  const elapsed = Date.now() - entry.startedAt;
  const price = priceFor(entry.model);
  if (elapsed < DEMO_GENERATION_DELAY_MS) {
    return {
      status: "processing",
      generation_id: id,
      model: entry.model,
      price_rub: price,
    };
  }
  return {
    status: "complete",
    generation_id: id,
    model: entry.model,
    result_url: entry.variant === "a" ? "/demo/image-a.svg" : "/demo/image-b.svg",
    display_url: entry.variant === "a" ? "/demo/image-a.svg" : "/demo/image-b.svg",
    price_rub: price,
    cost: price,
    refunded: false,
    error_message: null,
    created_at: new Date(entry.startedAt).toISOString(),
    updated_at: new Date().toISOString(),
  };
}
