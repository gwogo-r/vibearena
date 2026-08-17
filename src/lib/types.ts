// Общие типы для VibeMarketolog Agent API и внутренней логики VibeArena.

export type ParamSchema = {
  type?: string;
  enum?: string[];
  min?: number;
  max?: number;
};

export type ImageModel = {
  id: string;
  title?: string;
  provider?: string;
  type: "image";
  price_rub?: number;
  params?: Record<string, ParamSchema>;
  /** Модель умеет принимать референсное фото (image_input) — как опцию или как обязательный параметр. */
  supportsImageInput?: boolean;
  /** Без референсного фото эта модель не запустится (чистый image-editing, не годится для text-to-image без фото). */
  requiresImageInput?: boolean;
};

export type Capabilities = {
  image_models: ImageModel[];
};

export type EstimateRequest = {
  type: "image";
  model: string;
  prompt: string;
  strict: true;
  aspect_ratio?: string;
  seed?: number;
  /** Ссылка(и) на референсное фото товара — только для моделей с поддержкой image_input. */
  image_input?: string[];
};

export type EstimateResponse = {
  valid: boolean;
  body_valid?: boolean;
  funds_ok?: boolean;
  price_rub?: number;
  balance?: { current: number; after: number };
  balance_after?: number;
  daily_spend?: { limit: number; today: number; within_limit: boolean };
  param_rejections?: { field: string; value: unknown; allowed?: unknown; hint?: string }[];
  warnings?: string[];
};

export type GenerateRequest = EstimateRequest & {
  idempotency_key: string;
};

export type GenerateResponse = {
  status: "processing" | "complete" | "error";
  generation_id: number | string;
  price_rub?: number;
  cost?: number;
  balance_after?: number;
  replayed?: boolean;
};

export type GenerationStatus = {
  status: "pending" | "processing" | "complete" | "error";
  generation_id: number | string;
  model?: string;
  result_url?: string;
  display_url?: string;
  file_url?: string;
  price_rub?: number;
  cost?: number;
  error_message?: string | null;
  refunded?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type UploadMediaResponse = {
  status: "ok";
  url: string;
  kind?: string;
  mime?: string;
  size?: number;
  expires_at?: string;
};

export type VibeApiErrorBody = {
  status: "error";
  error: string;
  message: string;
  details?: Record<string, string[]>;
  request_id?: string;
};

export const CATEGORIES = [
  { id: "ad_banner", label: "Рекламный баннер" },
  { id: "russian_text", label: "Русский текст на изображении" },
  { id: "product_card", label: "Карточка товара" },
  { id: "photorealistic", label: "Фотореалистичное изображение" },
  { id: "illustration", label: "Иллюстрация" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const VOTE_REASONS = [
  { id: "prompt_match", label: "Лучше соблюдён промпт" },
  { id: "russian_text", label: "Лучше русский текст" },
  { id: "composition", label: "Лучше композиция" },
  { id: "realism", label: "Выше реализм" },
  { id: "ad_fit", label: "Лучше подходит для рекламы" },
  { id: "other", label: "Другое" },
] as const;

export type VoteReasonId = (typeof VOTE_REASONS)[number]["id"];

export type Winner = "a" | "b" | "tie";

export type VoteRecord = {
  id: string;
  created_at: string;
  category: CategoryId;
  prompt: string;
  model_a: string;
  model_b: string;
  winner: Winner;
  reason?: VoteReasonId;
  price_a_rub: number;
  price_b_rub: number;
  latency_a_ms: number;
  latency_b_ms: number;
};
