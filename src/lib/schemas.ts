// Zod-схемы для валидации того, что приходит от клиента в наши API routes.
// Никаких данных от клиента (модель, параметры, prompt) нельзя слать в VibeMarketolog без проверки.

import { z } from "zod";

export const PROMPT_MAX_LEN = 2000;

export const estimateBodySchema = z.object({
  model: z.string().min(1).max(200),
  prompt: z.string().min(1).max(PROMPT_MAX_LEN),
  aspect_ratio: z.string().max(20).optional(),
  seed: z.number().int().min(0).max(2147483647).optional(),
  // Значение приходит из ответа нашего /api/agent/upload-media (https-URL или demo data:-URL),
  // а не набирается пользователем вручную — поэтому без строгой проверки формата URL.
  image_input: z.array(z.string().min(1).max(2_000_000)).max(1).optional(),
});

export const generateBodySchema = estimateBodySchema.extend({
  idempotency_key: z.uuid(),
  // Только для demo mode — определяет, какое из двух фикстур-изображений отдать.
  variant: z.enum(["a", "b"]).default("a"),
});

export type EstimateBody = z.infer<typeof estimateBodySchema>;
export type GenerateBody = z.infer<typeof generateBodySchema>;
