// Типизированный клиент VibeMarketolog Agent API.
// Импортировать только на сервере (API routes) — токен никогда не должен попасть в браузер.

import type {
  Capabilities,
  EstimateRequest,
  EstimateResponse,
  GenerateRequest,
  GenerateResponse,
  GenerationStatus,
  UploadMediaResponse,
  VibeApiErrorBody,
} from "./types";

const BASE_URL = "https://lk.vibemarketolog.ru/api/agent";

export class VibeApiError extends Error {
  status: number;
  body: VibeApiErrorBody;

  constructor(status: number, body: VibeApiErrorBody) {
    super(body.message || body.error || "VibeMarketolog API error");
    this.status = status;
    this.body = body;
  }
}

function getToken(): string {
  const token = process.env.VIBE_API_TOKEN;
  if (!token) {
    throw new Error("VIBE_API_TOKEN не задан — используйте demo mode (см. src/lib/demo.ts)");
  }
  return token;
}

async function vibeFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...init?.headers,
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  // Реальные ошибки API всегда приходят с не-2xx HTTP-статусом (402/409/422/429/502…).
  // HTTP 200 + status:"error" в /generation/{id}/status — это легитимный результат
  // (генерация провалилась на стороне провайдера), а не ошибка вызова — не путать.
  if (!res.ok) {
    const body: VibeApiErrorBody = data ?? {
      status: "error",
      error: "unknown_error",
      message: "Пустой или некорректный ответ от VibeMarketolog API",
    };
    throw new VibeApiError(res.status, body);
  }

  return data as T;
}

// Реальная форма ответа GET /capabilities (проверено на боевом токене):
// { status: "ok", models: { image: { [model_id]: { price, description, required[], optional[], enums?, ... } }, ... } }
const DEFAULT_ASPECT_RATIOS = ["1:1", "16:9", "9:16", "3:2", "2:3", "auto"];

type RawImageModel = {
  price?: number;
  description?: string;
  required?: string[];
  optional?: string[];
  enums?: Record<string, string[]>;
};

function normalizeCapabilities(raw: unknown): Capabilities {
  const data = raw as { models?: { image?: Record<string, RawImageModel> } };
  const imageDict = data.models?.image;
  if (!imageDict || typeof imageDict !== "object") return { image_models: [] };

  const models = Object.entries(imageDict)
    // Наш флоу умеет только prompt (+ опционально одно референсное фото товара через image_input).
    // Модели с другими обязательными параметрами (parent_task_id, image_urls, layers…) — вне MVP.
    .filter(([, m]) => {
      const required = m.required ?? [];
      return required.includes("prompt") && required.every((p) => p === "prompt" || p === "image_input");
    })
    .map(([id, m]) => {
      const required = m.required ?? [];
      const optional = m.optional ?? [];
      const params: NonNullable<Capabilities["image_models"][number]["params"]> = {};
      if (optional.includes("aspect_ratio")) {
        params.aspect_ratio = { type: "enum", enum: m.enums?.aspect_ratio ?? DEFAULT_ASPECT_RATIOS };
      }
      if (optional.includes("seed")) {
        params.seed = { type: "number" };
      }
      if (optional.includes("quality")) {
        params.quality = { type: "enum", enum: m.enums?.quality ?? ["basic", "high"] };
      }
      return {
        id,
        title: m.description ?? id,
        type: "image" as const,
        price_rub: typeof m.price === "number" ? m.price : undefined,
        params,
        supportsImageInput: required.includes("image_input") || optional.includes("image_input"),
        requiresImageInput: required.includes("image_input"),
      };
    });

  return { image_models: models };
}

export async function getCapabilities(): Promise<Capabilities> {
  const raw = await vibeFetch<unknown>("/capabilities");
  return normalizeCapabilities(raw);
}

export function estimateGeneration(body: EstimateRequest): Promise<EstimateResponse> {
  return vibeFetch<EstimateResponse>("/generate/estimate", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function startGeneration(
  body: EstimateRequest,
  idempotencyKey: string
): Promise<GenerateResponse> {
  const req: GenerateRequest = { ...body, idempotency_key: idempotencyKey };
  return vibeFetch<GenerateResponse>("/generate", {
    method: "POST",
    body: JSON.stringify(req),
    headers: { "Idempotency-Key": idempotencyKey },
  });
}

export function getGenerationStatus(id: string): Promise<GenerationStatus> {
  return vibeFetch<GenerationStatus>(`/generation/${encodeURIComponent(id)}/status`);
}

// multipart/form-data — свой fetch, а не vibeFetch: там Content-Type жёстко json,
// а здесь его должен выставить сам fetch (с правильным boundary) по FormData.
export async function uploadMedia(file: Blob, filename: string): Promise<UploadMediaResponse> {
  const form = new FormData();
  form.append("file", file, filename);

  const res = await fetch(`${BASE_URL}/upload-media`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: form,
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const body: VibeApiErrorBody = data ?? {
      status: "error",
      error: "upload_failed",
      message: "Не удалось загрузить файл.",
    };
    throw new VibeApiError(res.status, body);
  }

  return data as UploadMediaResponse;
}
